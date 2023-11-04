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
    u: 192.4,
    v: 0.4,
    w: 63.2,
    h: 63.2,
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
