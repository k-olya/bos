// this script allows user to select rectangular areas on the loaded spritesheet
// use left mouse button to draw and mouse wheel to zoom and move around
// writes a sprite object with the following properties to the console
// u, v, w, h - sprite coordinates
// x, y, scalex, scaley - position and scale relative to the spritesheet

const ZOOM_BASE = 1.25;
const ZOOM_CAP = 20;
const PADDING = 0.4;

window.onload = function () {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  var gl = canvas.getContext("webgl2");

  var bos = new Bos(gl, canvas.width, canvas.height);

  const config = {
    image: spritesheet,
    textureFilter: gl.NEAREST,
    vertexAnimationCode: `
      c += center;
      c *= zoom;
      scale *= zoom;
    `,
    aspect: false,
    customVarying: ``,
    customUniforms: {
      zoom: "mediump float",
      center: "vec2",
    },
    customFragmentShader: ``,
  };

  // spritesheet layer
  bos.addLayer(config);
  // selection box layer
  bos.addLayer({ ...config, image: palette });
  // third layer to render the selected sprite
  bos.addLayer({ ...config, vertexAnimationCode: "" });

  const texturew = spritesheet.naturalWidth;
  const textureh = spritesheet.naturalHeight;
  let zoom = 0,
    dragx,
    dragy,
    centerx = 0,
    centery = 0;

  bos.layers[0].addSprite({
    x: 0,
    y: 0,
    rot: 0,
    scalex: 2,
    scaley: 2,
    u: 0,
    w: texturew,
    v: 0,
    h: textureh,
  });

  bos.layers.forEach(layer => {
    layer.setUniforms({ zoom: 1 });
  });

  function render(time) {
    window.requestAnimationFrame(render);

    bos.render(time / 1000);
  }
  render();

  let startx,
    starty,
    selectionw,
    selectionh,
    x,
    y,
    scalex,
    scaley,
    down = false,
    drag = false;

  const screenXToGl = x =>
    ((x * 2) / window.innerWidth - 1) / Math.pow(ZOOM_BASE, zoom) - centerx;
  const screenYToGl = y =>
    (1 - (y * 2) / window.innerHeight) / Math.pow(ZOOM_BASE, zoom) - centery;

  const round = (x, y) => Math.round(x * y) / y;

  window.addEventListener("mousedown", function (e) {
    if (e.button === 0) {
      startx = round(screenXToGl(e.clientX), texturew / 2);
      starty = round(screenYToGl(e.clientY), textureh / 2);
      down = true;
    } else if (e.button === 1) {
      drag = true;
      dragx = e.clientX;
      dragy = e.clientY;
    }
  });

  window.addEventListener("mousemove", function (e) {
    if (down) {
      selectionw = round(screenXToGl(e.clientX), texturew / 2) - startx;
      selectionh = round(screenYToGl(e.clientY), textureh / 2) - starty;

      x = startx + selectionw / 2;
      y = starty + selectionh / 2;
      scalex = Math.abs(selectionw);
      scaley = Math.abs(selectionh);
      bos.layers[1].modSprites(
        [
          {
            x,
            y,
            rot: 0,
            scalex,
            scaley,
            u: 100,
            w: 1,
            v: 100,
            h: 1,
            alpha: 0.5,
          },
        ],
        0
      );
    }
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
      zoom = Math.min(zoom + 1, ZOOM_CAP);
    }
    if (e.deltaY < 0) {
      zoom = Math.max(zoom - 1, -ZOOM_CAP);
    }
    bos.layers.forEach(layer => {
      layer.setUniforms({ zoom: Math.pow(ZOOM_BASE, zoom) });
    });
  });

  window.addEventListener("mouseup", function (e) {
    if (down && e.button === 0) {
      selectionw = round(screenXToGl(e.clientX), texturew / 2) - startx;
      selectionh = round(screenYToGl(e.clientY), textureh / 2) - starty;
      down = false;
      if (selectionh > 0) {
        starty = starty + selectionh;
      }
      if (selectionw < 0) {
        startx = startx + selectionw;
        selectionw = -selectionw;
      }

      const coeffx = texturew / 2;
      const coeffy = textureh / 2;
      // console.log(((1 - starty) / 2) * textureh);
      const uvwh = {
        u: (startx + 1) * coeffx + PADDING,
        v: (1 - starty) * coeffy + PADDING,
        w: selectionw * coeffx - PADDING * 2,
        h: Math.abs(selectionh) * coeffy - PADDING * 2,
      };
      const sprite = {
        ...uvwh,
        x: 0.75,
        y: -0.75,
        // multiply by aspect ratio to get a nice looking sprite
        scalex: (((0.5 * canvas.height) / canvas.width) * uvwh.w) / uvwh.h,
        scaley: 0.5,
      };
      console.log(JSON.stringify({ ...uvwh, x, y, scalex, scaley }));
      bos.layers[2].modSprites([sprite], 0);
    }
    if (drag && e.button === 1) {
      drag = false;
    }
  });

  window.addEventListener("resize", function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    bos.resize(canvas.width, canvas.height);
  });
};
