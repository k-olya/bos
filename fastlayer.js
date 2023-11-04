const fastVertexShaderSource = (a, v) => `
    attribute vec4 a_all;
    ${v}
    varying vec2 v_uv;
    
    uniform float u_time;

    void main() {
        vec2 pos = a_all.xy;
        vec2 uv = a_all.ba;

        ${a}

        v_uv = uv;
        gl_Position = vec4(pos, 0.0, 1.0);
    }

`;

const fastFragmentShaderSource = `
    precision mediump float;
    uniform sampler2D u_texture;

    varying vec2 v_uv;

    void main() {
        vec4 col = texture2D(u_texture, v_uv);
        gl_FragColor =vec4(col.xyz, 0.5 * col.a);
    }
`;

Bos.prototype.addFastLayer = function (opts) {
  this.layers.push(new FastLayer(this.gl, opts));
};

function FastLayer(gl, options) {
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
  this.data = new Float32Array(this.size * 24);

  this.textureFilter = opts.textureFilter;
  this.image = opts.image;
  this.textureWidth = opts.image.naturalWidth;
  this.textureHeight = opts.image.naturalHeight;
  this.vertexAnimationCode = opts.vertexAnimationCode;
  this.customFragmentShader = opts.customFragmentShader;

  this.dirty = { compile: true, texture: true, vbo: true };
}

FastLayer.prototype.addSprites = function (a) {
  this.modSprites(a, this.length);
};

FastLayer.prototype.modSprites = function (a, start = 0) {
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
    let data = new Float32Array(this.size * 24);
    data.set(this.data, 0);
    this.data = data;
    mod = false;
  }
  // set vertex attributes
  for (let i = 0; i < a.length; i++) {
    let index = (start + i) * 24;
    let c = a[i];
    let custom = c.custom || [];
    let chunk = vertices.flatMap(vx => {
      let u = c.u + (vx[2] === "uvright" ? c.w : 0) || 0;
      let v = c.v + (vx[3] === "uvbottom" ? c.h : 0) || 0;
      return [
        (c.x || 0) + vx[0] * c.scalex, // pos.x
        (c.y || 0) + vx[1] * c.scaley, // pos.y
        u / this.textureWidth, // uv.x
        1 - v / this.textureHeight, // uv.y
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

FastLayer.prototype.addSprite = function (sprite) {
  return this.addSprites([sprite]);
};

FastLayer.prototype.compile = function () {
  const gl = this.gl;
  this.vertexShader = createShader(
    gl,
    gl.VERTEX_SHADER,
    fastVertexShaderSource(
      this.vertexAnimationCode || "",
      this.customVars || ""
    )
  );
  this.fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    this.customFragmentShader || fastFragmentShaderSource
  );
  this.program = createProgram(gl, this.vertexShader, this.fragmentShader);
  this.attribute = gl.getAttribLocation(this.program, "a_all");
  this.uniforms = getUniformLocations(gl, this.program, "u_time", "u_texture");

  // mark compilation work as done
  this.dirty.compile = false;
};

FastLayer.prototype.createvbo = function () {
  this.vertexBuffer = createVertexBuffer(this.gl, this.data);
  this.dirty.vbo = false;
  this.dirty.vboStart = false;
  this.dirty.vboEnd = false;
};

FastLayer.prototype.createTexture = function () {
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

FastLayer.prototype.render = function (time) {
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
  enableVertexBuffer(gl, this.attribute, {
    buffer: this.vertexBuffer,
    size: 4,
  });
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, this.texture);
  gl.uniform1i(this.uniforms.u_texture, 0);
  gl.uniform1f(this.uniforms.u_time, time);

  // draw the layer on the screen
  gl.drawArrays(gl.TRIANGLES, 0, 6 * this.length);
};
