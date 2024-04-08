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

  // add a couple of sprites
  bos.layers[0].addSprite({
    x: 0,
    y: 0,
    u: 192.4,
    v: 6.4,
    w: 63.2,
    h: 57.2,
  });
  bos.layers[0].addSprite({
    x: 0,
    y: 0,
    u: 231.4,
    v: 99.4,
    w: 17.2,
    h: 25.2,
    scaley: 0.1,
  });

  // render loop
  function render(time) {
    window.requestAnimationFrame(render);

    bos.render(time / 1000);
  }
  render();

  // update sprites on mousemove
  window.addEventListener("mousemove", function (e) {
    // convert screen space (pixel) coordinates to gl's [-1; 1] space
    const x = bos.canvasXtoGl(e.clientX, canvas.height / canvas.width);
    const y = bos.canvasYtoGl(e.clientY);
    // patch sprite rotation
    bos.layers[0].patchSprite(
      {
        rot: Math.atan2(y, x) - Math.PI / 2,
      },
      0
    );
    // make sprite a cursor
    // substract from y to align cursor with the pointy hat
    bos.layers[0].patchSprite({ x, y: y - 0.045 }, 1);
  });

  // update width and height on resize
  window.addEventListener("resize", function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    bos.resize(canvas.width, canvas.height);
  });
};
