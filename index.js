window.onload = function () {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  var gl = canvas.getContext("webgl2");

  var bos = new Bos(gl, canvas.width, canvas.height);

  bos.addLayer({
    image: spritesheet,
    textureFilter: gl.NEAREST,
    vertexAnimationCode: `
      pos += sin(u_time * .2 * 3.14 * a_all[2][2]) * 1.0;
      // pos += mod(u_time * .2 * 3.14 * a_all[2][2], 2.) - 1.0;
    `,
    customVarying: "",
    customUniforms: "",
    customFragmentShader: "",
  });

  for (let i = 0; i < 2000; i++) {
    bos.layers[0].addSprite({
      x: 0.5 - Math.random(),
      y: 0.5 - Math.random(),
      rot: 0,
      scalex: 0.1 + 0.3 * Math.random(),
      scaley: 0.1 + 0.3 * Math.random(),
      uvbottom: 0,
      uvleft: 230,
      uvtop: 32,
      uvright: 230 + 20,
      alpha: 0.4 + 0.6 * Math.random(),
      custom: [Math.random()],
    });
  }

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
