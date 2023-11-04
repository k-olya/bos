window.onload = function () {
  // resize canvas to full screen
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // get gl context
  var gl = canvas.getContext("webgl2");

  // initialize bos
  var bos = new Bos(gl, canvas.width, canvas.height);

  // create layer config
  const config = {
    image: spritesheet,
    textureFilter: gl.NEAREST,
    vertexAnimationCode: ``,
    customVarying: ``,
    customUniforms: {},
    customFragmentShader: ``,
  };

  // setup layer
  bos.addLayer(config);

  // add a sprite
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
  });

  // render loop
  function render(time) {
    window.requestAnimationFrame(render);

    bos.render(time / 1000);
  }
  render();

  // update width and height on resize
  window.addEventListener("resize", function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    bos.resize(canvas.width, canvas.height);
  });
};
