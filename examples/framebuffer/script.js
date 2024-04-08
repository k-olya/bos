window.onload = function () {
  // resize canvas to full screen
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // get gl context
  var gl = canvas.getContext("webgl2");

  // initialize bos
  var bos = new Bos(gl, canvas.width, canvas.height);

  const noise = new Bos.FramebufferTexture(bos, {
    textureWidth: 256,
    textureHeight: 256,
  });
  const palette = new Bos.FramebufferTexture(bos, {
    textureWidth: 256,
    textureHeight: 256,
  });

  const fullscreenLayer = config => {
    const layer = bos.addLayer(config);
    layer.addSprite({
      scaley: 2,
      scalex: 2,
      u: 0,
      v: 0,
      w: layer.textureWidth,
      h: layer.textureHeight,
    });
    return layer;
  };

  const noiseLayer = fullscreenLayer({
    visible: false,
    outputFramebuffer: noise.framebuffer,
    width: 256,
    height: 256,
    precision: "mediump",
    customFragmentShader: noiseShader,
  });

  const paletteLayer = fullscreenLayer({
    visible: false,
    outputFramebuffer: palette.framebuffer,
    width: 256,
    height: 256,
    precision: "mediump",
    customFragmentShader: paletteShader,
    customUniforms: {
      u_colors: `vec3[${N}]`,
    },
  });

  const renderLayer = fullscreenLayer({
    framebufferTexture: [noise, palette],
    customFragmentShader: renderShader,
  });

  // generate noise and color palette
  noiseLayer.render();
  paletteLayer.setUniforms({
    u_colors: colors.flat(),
  });
  paletteLayer.render();

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
