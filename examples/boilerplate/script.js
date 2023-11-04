window.onload = function () {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  var gl = canvas.getContext("webgl2");

  var bos = new Bos(gl, canvas.width, canvas.height);

  const config = {
    image: spritesheet,
    textureFilter: gl.NEAREST,
    vertexAnimationCode: "",
    customVarying: "",
    customUniforms: "",
    customFragmentShader: "",
  };

  bos.addLayer(config);

  bos.layers[0].addSprite({
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
