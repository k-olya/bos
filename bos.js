const SPRITE_BYTES = 4 * 16 * 6;
const SPRITE_FLOATS = 16 * 6;
const MAX_BUFFER_SIZE_INCREMENT = 256;

const vertexShaderSource = (a, v) => `
    attribute mat4 a_all;
    ${v || ""}
    varying vec2 v_uv;
    varying float v_alpha;
    
    uniform highp float u_time;

    void main() {
        vec2 c = a_all[0].xy;
        vec2 scale = a_all[0].ba;
        float rot = a_all[1][0];
        float alpha = a_all[1][1];
        vec2 uv = a_all[1].ba;
        vec2 pos = a_all[2].xy;

        ${a || ""}

        pos = pos * scale + c;

        v_uv = uv;
        v_alpha = alpha;
        gl_Position = vec4(pos, 0.0, 1.0);
    }

`;

const fragmentShaderSource = custom =>
  custom ||
  `
    precision mediump float;
    uniform sampler2D u_texture;

    varying vec2 v_uv;
    varying float v_alpha;

    void main() {
        vec2 st = v_uv;
        vec4 col = texture2D(u_texture, st);
        gl_FragColor = vec4(col.xyz, col.a * v_alpha);
    }
`;

function Bos(gl, width, height) {
  this.gl = gl;
  this.width = width;
  this.height = height;
  this.layers = [];
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
}

Bos.prototype.addLayer = function (opts) {
  this.layers.push(new Layer(this.gl, opts));
};

Bos.prototype.render = function (time) {
  const gl = this.gl;
  this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  this.gl.viewport(0, 0, this.width, this.height);
  this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  for (let layer of this.layers) {
    layer.render(time);
  }
};

Bos.prototype.resize = function (width, height) {
  this.width = width;
  this.height = height;
};

function Layer(gl, options) {
  const opts = {
    image: null,
    textureFilter: gl.LINEAR,
    vertexAnimationCode: "",
    customFragmentShader: "",
    ...options,
  };
  this.gl = gl;
  this.size = 1;
  this.length = 0;
  // this.ab = new ArrayBuffer(this.size * SPRITE_BYTES);
  // this.data = new Float32Array(this.ab);
  this.data = new Float32Array(this.size * SPRITE_FLOATS);

  this.textureFilter = opts.textureFilter;
  this.image = opts.image;
  this.textureWidth = opts.image.naturalWidth;
  this.textureHeight = opts.image.naturalHeight;
  this.vertexAnimationCode = opts.vertexAnimationCode;
  this.customFragmentShader = opts.customFragmentShader;

  this.dirty = { compile: true, texture: true, vbo: true };
}

const vertices = [
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

Layer.prototype.addSprites = function (a) {
  this.modSprites(a, this.length);
};

Layer.prototype.modSprites = function (a, start = 0) {
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
      return [
        c.x || 0,
        c.y || 0,
        c.scalex || 1,
        c.scaley || 1,

        c.rot || 0,
        c.alpha || 1,
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

Layer.prototype.addSprite = function (sprite) {
  return this.addSprites([sprite]);
};

Layer.prototype.compile = function () {
  const gl = this.gl;
  this.vertexShader = createShader(
    gl,
    gl.VERTEX_SHADER,
    vertexShaderSource(this.vertexAnimationCode, this.customVars)
  );
  this.fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource(this.customFragmentShader)
  );
  this.program = createProgram(gl, this.vertexShader, this.fragmentShader);
  this.attribute = gl.getAttribLocation(this.program, "a_all");
  this.uniforms = getUniformLocations(gl, this.program, "u_time", "u_texture");

  // mark compilation work as done
  this.dirty.compile = false;
};

Layer.prototype.createvbo = function () {
  this.vertexBuffer = createVertexBuffer(this.gl, this.data);
  this.dirty.vbo = false;
  this.dirty.vboStart = false;
  this.dirty.vboEnd = false;
};

Layer.prototype.createTexture = function () {
  this.texture = createTexture(
    this.gl,
    this.gl.TEXTURE0,
    this.textureWidth,
    this.textureHeight,
    {
      pixels: this.image,
      minFilter: this.textureFilter,
      magFilter: this.textureFilter,
      flip: true,
      premultiply: true,
    }
  );
  this.dirty.texture = false;
};

Layer.prototype.render = function (time) {
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
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, this.texture);
  gl.uniform1i(this.uniforms.u_texture, 0);
  gl.uniform1f(this.uniforms.u_time, time);

  // draw the layer on the screen
  gl.drawArrays(gl.TRIANGLES, 0, 6 * this.length);
};
