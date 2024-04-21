import {
  GLContext,
  createProgram,
  createShader,
  createTexture,
  createVertexBuffer,
  getUniformLocations,
  TexturePixels,
} from "./gl-utils";

// constants
const SPRITE_BYTES = 4 * 16 * 6;
const SPRITE_FLOATS = 16 * 6;
const MAX_BUFFER_SIZE_INCREMENT = 256;

// shaders
const vertexShaderSource = (
  a: string,
  v: string,
  u: string,
  precision?: string,
  custom?: string
) => {
  let r =
    custom ||
    `
    // bos's default customizable vertex shader
    attribute mat4 a_all;
    varying vec2 v_uv;
    varying float v_alpha;
    
    // custom varying
    ${v || ""}
    // custom uniforms
    ${u || ""}
    // end of custom variable declarations
   
    // time is always highp
    uniform highp float u_time;
    uniform vec2 u_aspect;

    void main() {
        vec2 c = a_all[0].xy;
        vec2 scale = a_all[0].ba;
        float rot = a_all[1][0];
        float alpha = a_all[1][1];
        vec2 uv = a_all[1].ba;
        vec2 pos = a_all[2].xy;

        float custom0 = a_all[2][2];
        float custom1 = a_all[2][3];
        float custom2 = a_all[3][0];
        float custom3 = a_all[3][1];
        float custom4 = a_all[3][2];
        float custom5 = a_all[3][3];

        // custom animation code goes here
        ${a || ""}
        // end of custom animation code

        // rotate
        float _sin = sin(rot);
        float _cos = cos(rot);
        mat2 rotationMatrix = mat2(_cos, _sin, -_sin, _cos);
        pos = rotationMatrix * pos;

        // scale and translate
        pos = pos * scale + c;

        // apply aspect ratio
        pos *= u_aspect;

        v_uv = uv;
        v_alpha = alpha;
        gl_Position = vec4(pos, 0.0, 1.0);
    }

`;
  if (!custom && precision) r = `precision ${precision} float;` + r;
  // console.log(r);
  return r;
};

const fragmentShaderSource = (custom: string, precision?: string) => {
  let r =
    custom ||
    `
    // bos's default fragment shader
    uniform sampler2D u_texture0;

    varying vec2 v_uv;
    varying float v_alpha;

    void main() {
        vec2 st = v_uv;
        vec4 col = texture2D(u_texture0, st);
        gl_FragColor = vec4(col.xyz, col.a * v_alpha);
    }
`;
  if (!custom && precision) r = `precision ${precision} float;` + r;
  return r;
};

// type annotations

// root bos class
export interface Bos {
  // webgl context
  gl: WebGL2RenderingContext;
  // canvas width
  width: number;
  // canvas height
  height: number;
  // layers
  layers: Layer[];
  // add new layer
  addLayer: (opts: Partial<LayerOptions>) => Layer;
  // render all visible layer
  render: (time: number) => void;
  // update width and height, also resize all auto-resize layers
  resize: (width: number, height: number) => void;
  // convert canvas coordinates to gl coordinate
  canvasXtoGl: (x: number, aspect?: number) => number;
  canvasYtoGl: (y: number) => number;
}

interface BosConstructor {
  new (gl: GLContext, width: number, height: number, options?: BosOptions): Bos;
  (): void;
}

export interface BosOptions {}

const uniformTypes = {
  "lowp float": "uniform1f",
  "mediump float": "uniform1f",
  "highp float": "uniform1f",
  float: "uniform1f",
  vec2: "uniform2f",
  "lowp vec2": "uniform2f",
  "mediump vec2": "uniform2f",
  "highp vec2": "uniform2f",
  vec3: "uniform3f",
  "lowp vec3": "uniform3f",
  "mediump vec3": "uniform3f",
  "highp vec3": "uniform3f",
  "float[]": "uniform1fv",
  "lowp float[]": "uniform1fv",
  "mediump float[]": "uniform1fv",
  "highp float[]": "uniform1fv",
  "vec2[]": "uniform2fv",
  "lowp vec2[]": "uniform2fv",
  "mediump vec2[]": "uniform2fv",
  "highp vec2[]": "uniform2fv",
  "vec3[]": "uniform3fv",
  "lowp vec3[]": "uniform3fv",
  "mediump vec3[]": "uniform3fv",
  "highp vec3[]": "uniform3fv",
};

// provides api for rendering to a texture
export interface FramebufferTexture {
  // framebuffer object
  framebuffer: WebGLFramebuffer;
  // texture object
  texture: WebGLTexture;
  // texture width
  width: number;
  // texture height
  height: number;
  // webgl context
  gl: WebGL2RenderingContext;
  // set new width and height
  resize: (width: number, height: number) => void;
  // free all gpu-related resources
  free: () => void;
}

interface FramebufferTextureConstructor {
  new (bos: Bos, options?: FramebufferTextureOptions): FramebufferTexture;
  (): void;
}

export interface FramebufferTextureOptions {
  // initial image
  image?: TexturePixels | null;
  textureWidth?: number;
  textureHeight?: number;
  // gl.LINEAR or gl.NEAREST
  textureFilter?: number;
}

// all supported uniform types
export type UniformValue =
  | number
  | number[]
  | Float32Array
  | Int32Array
  | Float64Array
  | Uint32Array
  | Uint16Array
  | Uint8Array
  | Int16Array
  | Int32Array;

// float precision type
export type FloatPrecision = "highp" | "mediump" | "lowp" | null;

// this class represents a drawing layer
// each layer has its own vertex and fragment shaders
// up to 8 textures (including framebuffer textures)
// and an unlimited number of sprites
export interface Layer {
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
  presision: FloatPrecision;
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
  // add one sprite
  addSprite: (sprite: Sprite) => void;
  // add multiple sprites
  addSprites: (sprites: Sprite[]) => void;
  // write sprites to the buffer starting from a given index
  modSprites: (sprites: Sprite[], start: number) => void;
  // apply changes to one sprite without overwriting existing data
  patchSprite: (sprite: Partial<Sprite>, index: number) => void;
  // remove sprites from the buffer
  removeSprites: (start: number, len?: number) => void;
  // set one sprite's data to 0
  // use it if you want to remove a sprite without changing other sprites' indices
  nullSprite: (start: number, len?: number) => void;
  // read sprite data
  readSpriteData: (i: number) => Partial<Sprite>;
  // set uniforms
  setUniforms: (uniforms: { [key: string]: UniformValue }) => void;
  // setUniformsGL: (uniforms: { [key: string]: UniformValue }) => void;
  // set new width and height
  resize: (width: number, height: number) => void;
  // compile the shader
  compile: () => void;
  // create vertex buffer object
  createvbo: () => void;
  // update the image texture
  createTexture: () => void;
  // render the layer on demand
  render: (time?: number) => void;
}

interface LayerConstructor {
  new (bos: Bos, options: Partial<LayerOptions>): Layer;
  (): void;
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

// sprite interface
// it's not a real class, because sprites are written directly to the webgl buffer
// as a matter of fact, the non-ts version of bos doesn't even contain it
export interface Sprite {
  x?: number;
  y?: number;
  scalex?: number;
  scaley?: number;
  rot?: number;
  alpha?: number;
  u: number;
  v: number;
  w: number;
  h: number;
  custom?: number[];
}

// implementation

export const Bos: BosConstructor = function (
  this: Bos,
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
  options: BosOptions = {}
) {
  const opts = {
    ...options,
  };
  this.gl = gl;
  this.width = width;
  this.height = height;
  this.layers = [];
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
} as any;

Bos.prototype.addLayer = function (opts: Partial<LayerOptions>) {
  const layer = new Layer(this, opts);
  this.layers.push(layer);
  return layer;
};

Bos.prototype.render = function (time: number) {
  const gl = this.gl;
  // this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  // this.gl.viewport(0, 0, this.width, this.height);
  // this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  for (let i = 0; i < this.layers.length; i++) {
    if (this.layers[i].visible) {
      this.layers[i].render(time);
    }
  }
};

Bos.prototype.resize = function (width: number, height: number) {
  this.width = width;
  this.height = height;
  // resize all auto-resize layers
  for (let i = 0; i < this.layers.length; i++) {
    if (this.layers[i].autoResize) {
      this.layers[i].resize(width, height);
    }
  }
};

Bos.prototype.canvasXtoGl = function (x: number, aspect: number = 1) {
  return ((x / this.width) * 2 - 1) / (aspect || 1);
};

Bos.prototype.canvasYtoGl = function (y: number) {
  return 1 - (y / this.height) * 2;
};

export const FramebufferTexture: FramebufferTextureConstructor = function (
  this: FramebufferTexture,
  bos: Bos,
  options: FramebufferTextureOptions
) {
  const gl = bos.gl;
  this.gl = gl;
  const opts: Required<FramebufferTextureOptions> = {
    image: null,
    textureWidth: bos.width,
    textureHeight: bos.height,
    textureFilter: gl.LINEAR,
    ...options,
  };
  this.framebuffer = gl.createFramebuffer()!;
  this.texture = createTexture(
    gl,
    gl.TEXTURE0,
    opts.textureWidth,
    opts.textureHeight,
    {
      pixels: opts.image,
      minFilter: opts.textureFilter,
      magFilter: opts.textureFilter,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,
    }
  );
  gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    this.texture,
    0
  );
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  this.width = opts.textureWidth;
  this.height = opts.textureHeight;
} as any;

FramebufferTexture.prototype.resize = function (width: number, height: number) {
  const gl = this.gl;
  gl.bindTexture(gl.TEXTURE_2D, this.texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    width,
    height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null
  );
  gl.bindTexture(gl.TEXTURE_2D, null);
};

FramebufferTexture.prototype.free = function () {
  const gl = this.gl;
  gl.deleteFramebuffer(this.framebuffer);
  gl.deleteTexture(this.texture);
};

const Layer: LayerConstructor = function (
  this: Layer,
  bos: Bos,
  options: LayerOptions
) {
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
    precision: "highp",
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
  this.presision = opts.precision;

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
} as any;

Layer.prototype.resize = function (width: number, height: number) {
  this.width = width;
  this.height = height;
};

const vertices: [number, number, string, string][] = [
  // bottom left corner
  [-0.5, -0.5, "uvleft", "uvbottom"],
  // bottom right corner
  [0.5, -0.5, "uvright", "uvbottom"],
  // top left corner
  [-0.5, 0.5, "uvleft", "uvtop"],

  // top left corner
  [-0.5, 0.5, "uvleft", "uvtop"],
  // bottom right corner
  [0.5, -0.5, "uvright", "uvbottom"],
  // top right corner
  [0.5, 0.5, "uvright", "uvtop"],
];

Layer.prototype.addSprites = function (a: Sprite[]) {
  this.modSprites(a, this.length);
};

const defIfUndef = <T>(v: T | undefined, d: T) => (v === undefined ? d : v);

Layer.prototype.modSprites = function (a: Sprite[], start = 0) {
  const len = a.length + start;
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
  for (let i = 0; i < a.length; i++) {
    let index = (start + i) * SPRITE_FLOATS;
    let c = a[i];
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
};

Layer.prototype.addSprite = function (sprite: Sprite) {
  return this.addSprites([sprite]);
};

const attrOrder: Array<keyof Sprite> = [
  "x",
  "y",
  "scalex",
  "scaley",
  "rot",
  "alpha",
  "u",
  "v",
];

Layer.prototype.patchSprite = function (c: Partial<Sprite>, i = 0) {
  let custom = c.custom || [];
  for (let j = 0; j < 6; j++) {
    const index = i * SPRITE_FLOATS + j * 16;
    for (let k = 0; k < 6; k++) {
      if (c[attrOrder[k]] !== undefined) {
        this.data[index + k] = c[attrOrder[k]];
      }
    }
    if (c.u !== undefined) {
      let u = c.u + ((vertices[j][2] === "uvright" ? c.w : 0) || 0);
      this.data[index + 6] = u / this.textureWidth;
    }
    if (c.v !== undefined) {
      let v = c.v + ((vertices[j][3] === "uvbottom" ? c.h : 0) || 0);
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
};

Layer.prototype.readSpriteData = function (i: number = 0) {
  const c = {} as Partial<Sprite>;
  const index = i * SPRITE_FLOATS + 0 * 16;
  for (let k = 0; k < 6; k++) {
    c[attrOrder[k]] = this.data[index + k];
  }
  return c;
};

Layer.prototype.nullSprite = function (start: number, len: number = 1) {
  this.data.fill(0, start * SPRITE_FLOATS, len * SPRITE_FLOATS);
  this.dirty.vboStart =
    typeof this.dirty.vboStart === "number"
      ? Math.min(this.dirty.vboStart, start)
      : start;
  this.dirty.vboEnd =
    typeof this.dirty.vboEnd === "number"
      ? Math.max(this.dirty.vboEnd, start + len)
      : start + len;
};

Layer.prototype.removeSprites = function (start: number, len: number = 1) {
  this.data.copyWithin(start * SPRITE_FLOATS, (start + len) * SPRITE_FLOATS);
  this.data.fill(0, (this.length - len) * SPRITE_FLOATS, len * SPRITE_FLOATS);
  this.dirty.vbo = true;
  this.length -= len;
};

Layer.prototype.compile = function () {
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
    this.vertexShader = createShader(
      gl,
      gl.VERTEX_SHADER,
      this.customVertexShader(
        vertexShaderSource(
          this.vertexAnimationCode,
          this.customVarying,
          customUniformsList,
          this.presision,
          ""
        )
      )
    );
  } else {
    this.vertexShader = createShader(
      gl,
      gl.VERTEX_SHADER,
      vertexShaderSource(
        this.vertexAnimationCode,
        this.customVarying,
        customUniformsList,
        this.presision,
        this.customVertexShader
      )
    );
  }
  if (typeof this.customFragmentShader === "function") {
    this.fragmentShader = createShader(
      gl,
      gl.FRAGMENT_SHADER,
      this.customFragmentShader(fragmentShaderSource("", this.presision))
    );
  } else {
    this.fragmentShader = createShader(
      gl,
      gl.FRAGMENT_SHADER,
      fragmentShaderSource(this.customFragmentShader, this.presision)
    );
  }
  this.program = createProgram(gl, this.vertexShader, this.fragmentShader);
  this.attribute = gl.getAttribLocation(this.program, "a_all");
  this.uniforms = getUniformLocations(
    gl,
    this.program,
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
};

Layer.prototype.createvbo = function () {
  this.vertexBuffer = createVertexBuffer(this.gl, this.data);
  this.dirty.vbo = false;
  this.dirty.vboStart = false;
  this.dirty.vboEnd = false;
};

Layer.prototype.updateImage = function (i: number = 0) {
  if (!this.texture) this.texture = [];
  if (this.texture[i]) this.gl.deleteTexture(this.texture[i]);
  const image = Array.isArray(this.image) ? this.image[i] : this.image;
  this.texture[i] = createTexture(
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
};

Layer.prototype.createTexture = function () {
  if (!this.texture) this.texture = [];
  const images = Array.isArray(this.image) ? this.image : [this.image];
  for (let i = 0; i < images.length; i++) {
    this.updateImage(i);
  }
  this.dirty.texture = false;
};

Layer.prototype.setUniforms = function (uniforms: {
  [key: string]: UniformValue;
}) {
  this.uniformValues = { ...this.uniformValues, ...uniforms };
};

Layer.prototype.setUniformsGL = function (uniforms: {
  [key: string]: UniformValue;
}) {
  for (let u in uniforms) {
    if (!this.uniforms[u]) {
    }
    // if uniform is not used by the shader
    // skip iteration
    if (!this.uniforms[u]) continue;
    if (!this.customUniformsList.includes(u)) {
      throw new Error(`'${u}' not found in layer's uniforms list`);
    }
    // @ts-ignore
    const t = uniformTypes[this.customUniforms[u]];
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
      this.gl[t](this.uniforms[u], ...uniforms[u]);
    } else {
      this.gl[t](this.uniforms[u], uniforms[u]);
    }
  }
};

Layer.prototype.render = function (time: number = 0) {
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
  gl.useProgram(this.program);
  // pass attriputes
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
  for (let i = 0; i < 4; i++) {
    gl.enableVertexAttribArray(this.attribute + i);
    gl.vertexAttribPointer(this.attribute + i, 4, gl.FLOAT, false, 64, i * 16);
  }
  let t = 0;
  // set textures
  for (t; t < this.texture.length; t++) {
    gl.activeTexture(gl[`TEXTURE${t}`]);
    gl.bindTexture(gl.TEXTURE_2D, this.texture[t]);
    gl.uniform1i(this.uniforms[`u_texture${t}`], t);
  }
  // set framebuffer textures
  if (!Array.isArray(this.framebufferTexture)) {
    gl.activeTexture(gl[`TEXTURE${t}`]);
    gl.bindTexture(gl.TEXTURE_2D, this.framebufferTexture.texture);
    gl.uniform1i(this.uniforms[`u_texture${t}`], t);
  } else {
    for (let j = 0; j < this.framebufferTexture.length; j++) {
      gl.activeTexture(gl[`TEXTURE${t + j}`]);
      gl.bindTexture(gl.TEXTURE_2D, this.framebufferTexture[j].texture);
      gl.uniform1i(this.uniforms[`u_texture${t + j}`], t + j);
    }
  }
  gl.uniform1f(this.uniforms.u_time, time);

  // pass user uniforms to the shader
  if (this.uniformValues) {
    this.setUniformsGL(this.uniformValues);
  }

  // pass aspect ratio
  if (typeof this.aspect === "number") {
    gl.uniform2f(this.uniforms.u_aspect, this.aspect, 1);
  } else if (this.aspect) {
    gl.uniform2f(this.uniforms.u_aspect, this.height / this.width, 1);
  } else {
    gl.uniform2f(this.uniforms.u_aspect, 1, 1);
  }

  // bind output framebuffer
  gl.bindFramebuffer(gl.FRAMEBUFFER, this.outputFramebuffer);
  // update viewport size
  gl.viewport(0, 0, this.width, this.height);
  // draw the layer on the screen
  gl.drawArrays(gl.TRIANGLES, 0, 6 * this.length);
};

// add all the utility functions to the Bos export
// @ts-ignore
Bos.Utils = {
  createProgram,
  createShader,
  createTexture,
  createVertexBuffer,
  getUniformLocations,
};
// @ts-ignore
Bos.FramebufferTexture = FramebufferTexture;
// @ts-ignore
Bos.Layer = Layer;

export default Bos;
