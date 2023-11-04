window.onload = function () {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  var gl = canvas.getContext("webgl2");

  var bos = new Bos(gl, canvas.width, canvas.height);

  const config = {
    image: spritesheet,
    textureFilter: gl.NEAREST,
    vertexAnimationCode: `
      c.x += a_all[2][2] * sin(u_time * .2 * 3.14);
      c.y += a_all[2][2] *cos(u_time * .2 * 3.14 );
      // pos += mod(u_time * .2 * 3.14 * a_all[2][2], 2.) - 1.0;
    `,
  };
  bos.addLayer({
    ...config,
    image: stars,
    customFragmentShader: `
  precision mediump float;
    uniform sampler2D u_texture;
    uniform highp float u_time;

    varying vec2 v_uv;
    varying float v_alpha;

    void main() {
        vec2 delta = vec2(0.1, 0) * u_time;
        vec2 st = fract(v_uv + delta);
        vec4 col = texture2D(u_texture, st);
        gl_FragColor = vec4(col.xyz, col.a * v_alpha);
    }
  `,
  });
  bos.addLayer(config);

  bos.layers[0].addSprite({
    x: 0,
    y: 0,
    rot: 0,
    scalex: 2,
    scaley: 2,
    u: 0,
    w: 250,
    v: 0,
    h: 250,
    alpha: 0.65,
    custom: [0],
  });
  bos.layers[1].addSprite({
    x: 0,
    y: 0.2,
    rot: 0,
    scalex: 1,
    scaley: 0.8,
    u: 199,
    w: 50,
    v: 6,
    h: 41,
    custom: [0],
  });
  bos.layers[1].addSprite({
    x: 0,
    y: -0.4,
    rot: 0,
    scalex: 0.5,
    scaley: 0.4,
    u: 214,
    w: 20,
    v: 48,
    h: 12,
    custom: [0],
  });
  bos.layers[1].addSprite({
    x: 0,
    y: 0,
    rot: 0,
    scalex: 0.3,
    scaley: 0.3,
    u: 240,
    w: 15,
    v: 48,
    h: 15,
    custom: [0.78],
  });
  function render(time) {
    window.requestAnimationFrame(render);

    bos.render(time / 1000);
  }
  render();

  window.addEventListener("resize", function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    bos.resize(canvas.width, canvas.height);
  });
};
