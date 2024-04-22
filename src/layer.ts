import { Bos } from "./bos";
import {
  GLContext,
  createProgram,
  createShader,
  createTexture,
  createVertexBuffer,
  getUniformLocations,
  TexturePixels,
} from "./gl-utils";
import { FramebufferTexture } from "./framebuffer-texture";
import {
  FloatPrecision,
  Sprite,
  UniformLocations,
  UniformValue,
} from "./types";
import { uniformTypes, vertices, attrOrder } from "./constants";
import { fragmentShaderSource, vertexShaderSource } from "./shaders";

// constants
const SPRITE_BYTES = 4 * 16 * 6;
const SPRITE_FLOATS = 16 * 6;
const MAX_BUFFER_SIZE_INCREMENT = 256;
const DEFAULT_PRECISION = "highp";

// utility function
const defIfUndef = <T>(v: T | undefined, d: T) => (v === undefined ? d : v);
// this class represents a drawing layer
// each layer has its own vertex and fragment shaders
// up to 8 textures (including framebuffer textures)
// and an unlimited number of sprites
export class Layer {
  // parent bos instance
  bos: Bos;
  // webgl context
  gl: WebGL2RenderingContext;
  // buffer size
  size: number;
  // currently stored sprites count
  length: number;
  // data buffer
  data: Float32Array;
  // gl.LINEAR or gl.NEAREST
  textureFilter: number;
  // up to 8 html image elements or pixel data arrays
  image: TexturePixels | TexturePixels[];
  // up to 8 (together with images) framebuffer textures
  framebufferTexture: FramebufferTexture | FramebufferTexture[];
  // output framebuffer (null for canvas)
  outputFramebuffer: WebGLFramebuffer | null;
  // viewport width
  width: number;
  // viewport height
  height: number;
  // aspect ratio
  // true allows the layers to infer aspect ratio from width and height
  // false sets aspect ratio to 1
  // or you can set the value directly
  aspect: number | boolean;
  // texture width
  textureWidth: number;
  // texture height
  textureHeight: number;
  // glsl code to be inserted into the vertex shader
  vertexAnimationCode: string;
  // custom fragment shader
  customFragmentShader?: string | ((x: string) => string);
  // custom vertex shader
  customVertexShader?: string | ((x: string) => string);
  // custom uniforms
  customUniforms: { [key: string]: keyof typeof uniformTypes };
  // this object stores the lengths of array uniforms
  customArrayUniformsLengths: { [key: string]: number };
  // custom varying variable declarations to be inserted into the vertex shader
  customVarying: string;
  // uniform values
  uniformValues: { [key: string]: UniformValue };
  // custom uniform names as an array
  customUniformsList: string[];
  // render this layer on bos.render()
  visible: boolean;
  // resize this layer on bos.resize()
  autoResize: boolean;
  // float precision
  precision: FloatPrecision;
  // indicates that there is webgl work to be done
  // user code can update layer state multiple times
  // and then perform all corresponding webgl operations in one go
  dirty: {
    compile: boolean;
    texture: boolean;
    vbo: boolean;
    vboStart?: number;
    vboEnd?: number;
  };
  constructor(bos: Bos, options: Partial<LayerOptions>) {
    const gl = bos.gl;
    this.bos = bos;
    // @ts-ignore
    const img = options.image?.[0] || options.image;
    // @ts-ignore
    const fbt = options.framebufferTexture?.[0] || options.framebufferTexture;
    let textureWidth = img?.naturalWidth;
    const opts: Required<LayerOptions> = {
      image: [],
      aspect: true,
      framebufferTexture: [],
      outputFramebuffer: null,
      width: bos.width,
      height: bos.height,
      textureWidth:
        img?.naturalWidth || fbt?.width || options?.width || bos.width || 0,
      textureHeight:
        img?.naturalHeight || fbt?.height || options?.height || bos.height || 0,
      visible: true,
      autoResize: options.height === undefined && options.width === undefined,
      textureFilter: gl.LINEAR,
      vertexAnimationCode: "",
      customFragmentShader: "",
      customVertexShader: "",
      customVarying: "",
      customUniforms: {},
      precision: DEFAULT_PRECISION,
      uniformValues: {},
      ...options,
    };
    if ((img || fbt) && (!opts.textureWidth || !opts.textureHeight)) {
      throw new Error("Texture width or texture height not specified");
    }
    this.gl = gl;
    this.size = 1;
    this.length = 0;
    // this.ab = new ArrayBuffer(this.size * SPRITE_BYTES);
    // this.data = new Float32Array(this.ab);
    this.data = new Float32Array(this.size * SPRITE_FLOATS);

    this.visible = opts.visible;
    this.textureFilter = opts.textureFilter;
    this.image = opts.image;
    this.width = opts.width;
    this.height = opts.height;
    this.textureWidth = opts.textureWidth;
    this.textureHeight = opts.textureHeight;
    this.vertexAnimationCode = opts.vertexAnimationCode;
    this.customVertexShader = opts.customVertexShader;
    this.customFragmentShader = opts.customFragmentShader;
    this.customVarying = opts.customVarying;
    this.uniformValues = opts.uniformValues;
    this.customUniformsList = Object.keys(opts.customUniforms);
    this.outputFramebuffer = opts.outputFramebuffer;
    this.framebufferTexture = opts.framebufferTexture;
    this.autoResize = opts.autoResize;
    this.aspect = opts.aspect;
    this.precision = opts.precision;

    // set private properties

    // set custom uniforms
    this.customUniforms = {};
    this.customArrayUniformsLengths = {};
    for (let u in opts.customUniforms) {
      // @ts-ignore
      this.customUniforms[u] = opts.customUniforms[u].replace(/\[\d+\]/g, "[]");
      const match = opts.customUniforms[u].split(/\[|\]/g);
      if (match[1]) this.customArrayUniformsLengths[u] = parseInt(match[1]);
    }

    this.dirty = { compile: true, texture: true, vbo: true };
  }
  // add one sprite
  addSprite(sprite: Sprite) {
    return this.addSprites([sprite]);
  }
  // add multiple sprites
  addSprites(sprites: Sprite[]) {
    this.modSprites(sprites, this.length);
  }
  // write sprites to the buffer starting from a given index
  modSprites(sprites: Sprite[], start: number) {
    const len = sprites.length + start;
    let mod = true;
    // resize the underlying array buffer to fit new content
    if (len > this.size) {
      while (len > this.size) {
        this.size += Math.max(
          len,
          Math.min(this.size, MAX_BUFFER_SIZE_INCREMENT)
        );
      }
      let data = new Float32Array(this.size * SPRITE_FLOATS);
      data.set(this.data, 0);
      this.data = data;
      mod = false;
    }
    // set vertex attributes
    for (let i = 0; i < sprites.length; i++) {
      let index = (start + i) * SPRITE_FLOATS;
      let c = sprites[i];
      let custom = c.custom || [];
      let chunk = vertices.flatMap(vx => {
        // calculate uv coordinates based on options and vertex data
        let u = c.u + (vx[2] === "uvright" ? c.w : 0) || 0;
        let v = c.v + (vx[3] === "uvbottom" ? c.h : 0) || 0;
        let scaley = defIfUndef(c.scaley, 1);
        let scalex = defIfUndef(c.scalex, (c.w / c.h) * scaley || scaley);
        return [
          c.x || 0,
          c.y || 0,
          scalex,
          scaley,

          c.rot || 0,
          defIfUndef(c.alpha, 1),
          u / this.textureWidth, // uv.x
          1 - v / this.textureHeight, // uv.y

          vx[0] || 0, // pos.x
          vx[1] || 0, // pos.y
          custom[0] || 0,
          custom[1] || 0,

          custom[2] || 0,
          custom[3] || 0,
          custom[4] || 0,
          custom[5] || 0,
        ];
      });
      this.data.set(chunk, index);
    }
    // mark vbo data as modified
    if (mod) {
      // either partially
      this.dirty.vboStart =
        typeof this.dirty.vboStart === "number"
          ? Math.min(this.dirty.vboStart, start)
          : start;
      this.dirty.vboEnd =
        typeof this.dirty.vboEnd === "number"
          ? Math.max(this.dirty.vboEnd, len)
          : len;
    } else {
      // or completely
      this.dirty.vbo = true;
    }
    this.length = len;
  }
  // apply changes to one sprite without overwriting existing data
  patchSprite(sprite: Partial<Sprite>, i: number) {
    let custom = sprite.custom || [];
    for (let j = 0; j < 6; j++) {
      const index = i * SPRITE_FLOATS + j * 16;
      for (let k = 0; k < 6; k++) {
        if (sprite[attrOrder[k]] !== undefined) {
          // @ts-ignore
          this.data[index + k] = sprite[attrOrder[k]];
        }
      }
      if (sprite.u !== undefined) {
        let u = sprite.u + ((vertices[j][2] === "uvright" ? sprite.w : 0) || 0);
        this.data[index + 6] = u / this.textureWidth;
      }
      if (sprite.v !== undefined) {
        let v =
          sprite.v + ((vertices[j][3] === "uvbottom" ? sprite.h : 0) || 0);
        this.data[index + 7] = 1 - v / this.textureHeight;
      }
      for (let k = 0; k < 6; k++) {
        if (custom[k] !== undefined) {
          this.data[index + 10 + k] = custom[k];
        }
      }
    }
    this.dirty.vboStart =
      typeof this.dirty.vboStart === "number"
        ? Math.min(this.dirty.vboStart, i)
        : i;
    this.dirty.vboEnd =
      typeof this.dirty.vboEnd === "number"
        ? Math.max(this.dirty.vboEnd, i + 1)
        : i + 1;
  }
  // remove sprites from the buffer
  removeSprites(start: number, len: number = 1) {
    this.data.copyWithin(start * SPRITE_FLOATS, (start + len) * SPRITE_FLOATS);
    this.data.fill(0, (this.length - len) * SPRITE_FLOATS, len * SPRITE_FLOATS);
    this.dirty.vbo = true;
    this.length -= len;
  }
  // set one sprite's data to 0
  // use it if you want to remove a sprite without changing other sprites' indices
  nullSprite(start: number, len: number = 1) {
    this.data.fill(0, start * SPRITE_FLOATS, len * SPRITE_FLOATS);
    this.dirty.vboStart =
      typeof this.dirty.vboStart === "number"
        ? Math.min(this.dirty.vboStart, start)
        : start;
    this.dirty.vboEnd =
      typeof this.dirty.vboEnd === "number"
        ? Math.max(this.dirty.vboEnd, start + len)
        : start + len;
  }
  // read sprite data
  // TODO: add custom sprite data
  readSpriteData(i: number): Partial<Sprite> {
    const c = {} as Partial<Sprite>;
    const index = i * SPRITE_FLOATS + 0 * 16;
    for (let k = 0; k < 6; k++) {
      // @ts-ignore
      c[attrOrder[k]] = this.data[index + k];
    }
    return c;
  }
  // set uniforms
  setUniforms(uniforms: { [key: string]: UniformValue }) {
    this.uniformValues = { ...this.uniformValues, ...uniforms };
  }
  setUniformsGL(uniforms: { [key: string]: UniformValue }) {
    for (let u in uniforms) {
      if (!this._uniforms[u]) {
      }
      // if uniform is not used by the shader
      // skip iteration
      if (!this._uniforms[u]) continue;
      if (!this.customUniformsList.includes(u)) {
        throw new Error(`'${u}' not found in layer's uniforms list`);
      }
      const t = uniformTypes[this.customUniforms[u]];
      // @ts-ignore
      if (!this.gl[t]) {
        throw new Error(
          `'${u}' has unrecognized type '${this.customUniforms[u]}'`
        );
      }
      if (
        typeof uniforms[u] === "object" &&
        !this.customArrayUniformsLengths[u]
      ) {
        // @ts-ignore
        this.gl[t](this._uniforms[u], ...uniforms[u]);
      } else {
        // @ts-ignore
        this.gl[t](this._uniforms[u], uniforms[u]);
      }
    }
  }
  // set new width and height
  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  // compile the shader
  compile() {
    const gl = this.gl;
    const customUniformsList = this.customUniformsList
      .map((u: string) => {
        const cu = this.customUniforms[u];
        const l = this.customArrayUniformsLengths[u];
        if (l) {
          const t = cu.split("[");
          return `\nuniform ${t[0]} ${u}[${l}${t[1]};`;
        } else {
          return `\nuniform ${cu} ${u};`;
        }
      })
      .join("");
    if (typeof this.customVertexShader === "function") {
      this._vertexShader = createShader(
        gl,
        gl.VERTEX_SHADER,
        this.customVertexShader(
          vertexShaderSource(
            this.vertexAnimationCode,
            this.customVarying,
            customUniformsList,
            this.precision || DEFAULT_PRECISION,
            ""
          )
        )
      );
    } else {
      this._vertexShader = createShader(
        gl,
        gl.VERTEX_SHADER,
        vertexShaderSource(
          this.vertexAnimationCode,
          this.customVarying,
          customUniformsList,
          this.precision || DEFAULT_PRECISION,
          this.customVertexShader
        )
      );
    }
    if (typeof this.customFragmentShader === "function") {
      this._fragmentShader = createShader(
        gl,
        gl.FRAGMENT_SHADER,
        this.customFragmentShader(
          fragmentShaderSource("", this.precision || DEFAULT_PRECISION)
        )
      );
    } else {
      this._fragmentShader = createShader(
        gl,
        gl.FRAGMENT_SHADER,
        fragmentShaderSource(
          this.customFragmentShader || "",
          this.precision || DEFAULT_PRECISION
        )
      );
    }
    this._program = createProgram(
      gl,
      this._vertexShader!,
      this._fragmentShader!
    );
    this._attribute = gl.getAttribLocation(this._program!, "a_all");
    this._uniforms = getUniformLocations(
      gl,
      this._program!,
      "u_time",
      "u_texture0",
      "u_texture1",
      "u_texture2",
      "u_texture3",
      "u_texture4",
      "u_texture5",
      "u_texture6",
      "u_texture7",
      "u_aspect",
      // @ts-ignore
      ...this.customUniformsList
    );

    // mark compilation work as done
    this.dirty.compile = false;
  }
  // create vertex buffer object
  createvbo() {
    this._vertexBuffer = createVertexBuffer(this.gl, this.data);
    this.dirty.vbo = false;
    this.dirty.vboStart = undefined;
    this.dirty.vboEnd = undefined;
  }
  // update the image texture
  createTexture() {
    if (!this._texture) this._texture = [];
    const images = Array.isArray(this.image) ? this.image : [this.image];
    for (let i = 0; i < images.length; i++) {
      this.updateImage(i);
    }
    this.dirty.texture = false;
  }
  // render the layer on demand
  render(time?: number) {
    // send modified properties to gpu
    if (this.dirty.compile) {
      this.compile();
    }
    if (this.dirty.vbo || this.dirty.vboStart || this.dirty.vboEnd) {
      this.createvbo();
    }
    if (this.dirty.texture) {
      this.createTexture();
    }
    const gl = this.gl;
    // bind canvas framebuffer
    // gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    // select render shader
    gl.useProgram(this._program);
    // pass attriputes
    gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
    for (let i = 0; i < 4; i++) {
      gl.enableVertexAttribArray(this._attribute + i);
      gl.vertexAttribPointer(
        this._attribute + i,
        4,
        gl.FLOAT,
        false,
        64,
        i * 16
      );
    }
    let t = 0;
    // set textures
    for (t; t < this._texture!.length; t++) {
      // @ts-expect-error
      gl.activeTexture(gl[`TEXTURE${t}`]);
      gl.bindTexture(gl.TEXTURE_2D, this._texture![t]);
      gl.uniform1i(this._uniforms[`u_texture${t}`], t);
    }
    // set framebuffer textures
    if (!Array.isArray(this.framebufferTexture)) {
      // @ts-expect-error
      gl.activeTexture(gl[`TEXTURE${t}`]);
      gl.bindTexture(gl.TEXTURE_2D, this.framebufferTexture.texture);
      gl.uniform1i(this._uniforms[`u_texture${t}`], t);
    } else {
      for (let j = 0; j < this.framebufferTexture.length; j++) {
        // @ts-expect-error
        gl.activeTexture(gl[`TEXTURE${t + j}`]);
        gl.bindTexture(gl.TEXTURE_2D, this.framebufferTexture[j].texture);
        gl.uniform1i(this._uniforms[`u_texture${t + j}`], t + j);
      }
    }
    gl.uniform1f(this._uniforms.u_time, time || 0);

    // pass user uniforms to the shader
    if (this.uniformValues) {
      this.setUniformsGL(this.uniformValues);
    }

    // pass aspect ratio
    if (typeof this.aspect === "number") {
      gl.uniform2f(this._uniforms.u_aspect, this.aspect, 1);
    } else if (this.aspect) {
      gl.uniform2f(this._uniforms.u_aspect, this.height / this.width, 1);
    } else {
      gl.uniform2f(this._uniforms.u_aspect, 1, 1);
    }

    // bind output framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.outputFramebuffer);
    // update viewport size
    gl.viewport(0, 0, this.width, this.height);
    // draw the layer on the screen
    gl.drawArrays(gl.TRIANGLES, 0, 6 * this.length);
  }

  // private properties
  private _vertexShader: WebGLShader | null = null;
  private _fragmentShader: WebGLShader | null = null;
  private _program: WebGLProgram | null = null;
  private _attribute: number = 0;
  private _vertexBuffer: WebGLBuffer | null = null;
  private _texture: WebGLTexture[] | null = null;
  private _uniforms: UniformLocations = {};
  // update the image texture
  private updateImage(i: number = 0) {
    if (!this._texture) this._texture = [];
    if (this._texture[i]) this.gl.deleteTexture(this._texture[i]);
    const image = Array.isArray(this.image) ? this.image[i] : this.image;
    this._texture[i] = createTexture(
      this.gl,
      this.gl.TEXTURE0,
      this.textureWidth,
      this.textureHeight,
      {
        pixels: image,
        minFilter: this.textureFilter,
        magFilter: this.textureFilter,
        flip: true,
        premultiply: true,
      }
    );
  }
}

export interface LayerOptions {
  image?: TexturePixels | TexturePixels[];
  framebufferTexture?: FramebufferTexture | FramebufferTexture[];
  outputFramebuffer?: WebGLFramebuffer | null;
  width?: number;
  height?: number;
  aspect?: number | boolean;
  textureWidth?: number;
  textureHeight?: number;
  textureFilter?: number;
  vertexAnimationCode?: string;
  customFragmentShader?: string | ((x: string) => string);
  customVertexShader?: string | ((x: string) => string);
  customVarying?: string;
  customUniforms?: { [key: string]: string };
  precision?: FloatPrecision;
  visible?: boolean;
  autoResize?: boolean;
  uniformValues?: { [key: string]: UniformValue };
}
