const ZOOM_BASE = 1.25;
const ZOOM_MAX = 10;
const ZOOM_MIN = -4;
const MAX_VELOCITY = 0.5;
const MIN_VELOCITY = 0.2;

const QTY = 5e4;
const UPDATE_CHUNK_SIZE = QTY * 0.02;

totalSpan.innerHTML = QTY;
updatedSpan.innerHTML = UPDATE_CHUNK_SIZE;

window.onload = function () {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  var gl = canvas.getContext("webgl2");

  var bos = new Bos(gl, canvas.width, canvas.height);

  const config = {
    image: map,
    textureFilter: gl.NEAREST,
    vertexAnimationCode: `
      c += vec2(custom0, custom1) * (u_time - custom2);
      c += center;
      c *= zoom;
      scale *= zoom;
    `,
    customVarying: ``,
    customUniforms: {
      zoom: "mediump float",
      center: "vec2",
    },
    customFragmentShader: ``,
  };

  // map layer
  bos.addLayer({ ...config, image: map });
  // spritesheet layer
  bos.addLayer({ ...config, image: spritesheet });

  let zoom = 0,
    dragx,
    dragy,
    centerx = 0,
    centery = 0;

  bos.layers[0].addSprite({
    x: 0,
    y: 0,
    scaley: 5,
    u: 0,
    w: map.naturalWidth,
    v: 0,
    h: map.naturalHeight,
  });

  const positions = [];
  const velocities = [];
  for (let i = 0; i < QTY; i++) {
    positions.push([0, 0]);
    velocities.push([0, 0, performance.now() * 0.001]);
    bos.layers[1].addSprite({
      x: positions[i][0],
      y: positions[i][1],
      scaley: 0.05,
      u: 56.4,
      v: 16.4,
      w: 401.2,
      h: 409.2,
      rot: Math.atan2(velocities[i][1], velocities[i][0]) - Math.PI / 2,
      custom: velocities[i],
    });
  }

  bos.layers.forEach(layer => {
    layer.setUniforms({ zoom: 1 });
  });

  let fpsT = performance.now();
  let frames = 0;
  function render(time) {
    window.requestAnimationFrame(render);

    bos.render(time / 1000);

    if (time - fpsT > 250) {
      fpsSpan.innerHTML = frames * 4;
      fpsT = time;
      frames = 0;
    } else frames++;
  }
  render();

  let drag = false;

  window.addEventListener("mousedown", function (e) {
    if (e.button === 0) {
      drag = true;
      canvas.classList.add("grabbing");
      dragx = e.clientX;
      dragy = e.clientY;
    }
  });

  window.addEventListener("mousemove", function (e) {
    if (drag) {
      const deltax = e.clientX - dragx;
      const deltay = e.clientY - dragy;
      dragx = e.clientX;
      dragy = e.clientY;

      centerx += (deltax / Math.pow(ZOOM_BASE, zoom) / window.innerWidth) * 2;
      centery -= (deltay / Math.pow(ZOOM_BASE, zoom) / window.innerHeight) * 2;

      bos.layers.forEach(layer => {
        layer.setUniforms({ center: [centerx, centery] });
      });
    }
  });

  window.addEventListener("wheel", function (e) {
    if (e.deltaY > 0) {
      zoom = Math.min(zoom + 1, ZOOM_MAX);
    }
    if (e.deltaY < 0) {
      zoom = Math.max(zoom - 1, ZOOM_MIN);
    }
    bos.layers.forEach(layer => {
      layer.setUniforms({ zoom: Math.pow(ZOOM_BASE, zoom) });
    });
  });

  window.addEventListener("mouseup", function (e) {
    if (drag && e.button === 0) {
      drag = false;
      canvas.classList.remove("grabbing");
    }
  });

  window.addEventListener("resize", function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    bos.resize(canvas.width, canvas.height);
  });

  let current = 0;
  window.setInterval(function () {
    for (let i = current; i < current + UPDATE_CHUNK_SIZE && i < QTY; i++) {
      positions[i][0] =
        positions[i][0] +
        velocities[i][0] * (performance.now() * 0.001 - velocities[i][2]);
      positions[i][1] =
        positions[i][1] +
        velocities[i][1] * (performance.now() * 0.001 - velocities[i][2]);
      const angle = Math.random() * Math.PI * 2;
      const velocity =
        MIN_VELOCITY + Math.random() * (MAX_VELOCITY - MIN_VELOCITY);
      velocities[i] = [
        velocity * Math.cos(angle),
        velocity * Math.sin(angle),
        performance.now() * 0.001,
      ];
      bos.layers[1].patchSprite(
        {
          x: positions[i][0],
          y: positions[i][1],
          rot: Math.atan2(velocities[i][1], velocities[i][0]) - Math.PI / 2,
          custom: velocities[i],
        },
        i
      );
    }
    current += UPDATE_CHUNK_SIZE;
    if (current > bos.layers[1].length) {
      current = 0;
    }
  }, 20);
};
