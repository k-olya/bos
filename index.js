window.onload = function () {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  var gl = canvas.getContext("webgl2");
  var bos = new Bos(gl, canvas.width, canvas.height);

  bos.addLayer({
    image: spritesheet,
    textureFilter: gl.NEAREST,
    vertexAnimationCode: "",
    customVarying: "",
    customUniforms: "",
    customFragmentShader: "",
  });

  bos.layers[0].addSprite({
    x: 0,
    y: 0,
    rot: 0,
    scalex: 1,
    scaley: 1,
    uvbottom: 0,
    uvleft: 0,
    uvtop: 1,
    uvright: 1,
    alpha: 1,
  });

  function render(time) {
    window.requestAnimationFrame(render);

    bos.render(time % 1);
  }
  render();

  window.addEventListener("resize", function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    bos.resize(canvas.width, canvas.height);
  });
};
