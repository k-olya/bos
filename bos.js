const SPRITE_BYTES = 4 * 16 * 6;
const MAX_BUFFER_SIZE_INCREMENT = 256;

function Bos(gl, width, height) {
  this.gl = gl;
  this.width = width;
  this.height = height;
  this.layers = [];
}

Bos.prototype.addLayer = function (opts) {
  this.layers.push(new Layer(this.gl, opts));
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
  this.ab = new ArrayBuffer(this.size * SPRITE_BYTES);
  this.data = new Float32Array(this.ab);
  this.schedule = [];
}

Layer.prototype.addSprites = function (a) {
  const len = a.length + this.length;
  // resize the underlying array buffer to fit new content
  if (len > this.size) {
    this.size += Math.max(len, Math.min(this.size, MAX_BUFFER_SIZE_INCREMENT));
    this.ab.resize(this.size * SPRITE_BYTES);
  }
  // set vertex attributes
  for (let i = 0; i < a.length; i++) {
    let index = (this.length + i) * SPRITE_BYTES;
    let c = a[i];
    let custom = c.custom || [];
    let chunk = [
      c.x || 0,
      c.y || 0,
      c.rot || 0,
      c.scalex || 1,
      c.scaley || 1,
      c.uvbottom || 0,
      c.uvleft || 0,
      c.uvtop || 1,
      c.uvright || 1,
      c.alpha || 1,
      custom[0] || 0,
      custom[1] || 0,
      custom[2] || 0,
      custom[3] || 0,
      custom[4] || 0,
    ];
    for (let j of [-2, -1, 1, 2]) {
      this.data.set([...chunk, j], index++);
    }
  }
  this.length = len;
};

// types of scheduled render pipline functions
const SCHEDULED_FUNCTIONS = {
  createvbo: [],
  modvbo: ["start", "length"],
  compile: [],
  createTexture: [],
  modifyTexture: [],
  setupRender: [],
  render: ["time"],
};
