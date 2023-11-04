const MODE = "gpu";
const SIZE = 0.05;
const SAS = 1e4; // qty
console.log(`qty: ${SAS.toExponential()}`);

window.onload = function () {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  var gl = canvas.getContext("webgl2");

  var bos = new Bos(gl, canvas.width, canvas.height);

  const config = {
    image: spritesheet,
    textureFilter: gl.NEAREST,
    vertexAnimationCode:
      MODE !== "cpu"
        ? `
      c.x += sin(u_time * .2 * 3.14 * a_all[2][2]) * 1.0;
      c.y += cos(u_time * .2 * 3.14 * a_all[2][2]) * 1.0;
      // pos += mod(u_time * .2 * 3.14 * a_all[2][2], 2.) - 1.0;
    `
        : ``,
    customVarying: "",
    customUniforms: "",
    customFragmentShader: "",
  };
  if (MODE === "cpu") {
    bos.addFastLayer(config);
  } else {
    bos.addLayer(config);
  }

  var positions = [];
  var scales = [];
  var alphas = [];
  var customs = [];
  for (let i = 0; i < SAS; i++) {
    positions.push([(0.5 - Math.random()) * 2, (0.5 - Math.random()) * 2]);
    scales.push([
      SIZE * (1 + 3 * Math.random()),
      SIZE * (1 + 3 * Math.random()),
    ]);
    customs.push([Math.random()]);
    bos.layers[0].addSprite({
      x: positions[i][0],
      y: positions[i][1],
      rot: 0,
      scalex: scales[i][0],
      scaley: scales[i][0],
      u: 193,
      w: 63,
      v: 0,
      h: 63,
      alpha: 0.4 + 0.6 * Math.random(),
      custom: [customs[i]],
    });
    // console.log(positions[i], scales[i], customs[i]);
  }

  function modSprites(time) {
    for (let i = 0; i < SAS; i++) {
      // customs[i] = 0.1;
      bos.layers[0].modSprites(
        [
          {
            x:
              positions[i][0] +
              Math.sin((time / 1000) * 0.2 * 3.14 * customs[i]),
            y:
              positions[i][1] +
              Math.cos((time / 1000) * 0.2 * 3.14 * customs[i]),
            rot: 0,
            scalex: scales[i][0],
            scaley: scales[i][1],
            u: 193,
            w: 63,
            v: 0,
            h: 63,
            alpha: 0.5, // 0.4 + 0.6 * Math.random(),
            custom: [customs[i]],
          },
        ],
        i
      );
    }
  }

  function render(time) {
    window.requestAnimationFrame(render);
    if (MODE === "cpu") {
      modSprites(time);
    }

    bos.render(time / 1000);
  }
  render();

  window.addEventListener("resize", function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    bos.resize(canvas.width, canvas.height);
  });
};
