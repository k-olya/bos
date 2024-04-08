// generates a color palette texture

// hex string to gl color value
const hextogl = hex =>
  [hex.substring(0, 2), hex.substring(2, 4), hex.substring(4, 6)].map(
    h => parseInt(h, 16) / 255.0
  );

// pink to blue gradient
let _colors = [
  //  "f72585",
  //  "b5179e",
  //  purple to blue
  "7209b7",
  "560bad",
  "480ca8",
  "3a0ca3",
  "3f37c9",
  "4361ee",
  "4895ef",
  "4cc9f0",
].map(hextogl);

_colors = _colors.concat(_colors.slice(1, -1).reverse());

//console.log(colors);
var N = _colors.length;

var colors = _colors;

var paletteShader = `
        precision mediump float;
        varying vec2 v_uv;

uniform vec3 u_colors[${N}];

void main() {
  vec2 st = v_uv;

  vec3 color;
  float value = st.x;

  color = u_colors[${N - 1}];
  for (int i = 0; i < ${N}; i++) {
    if (value < 0.5 / ${N.toFixed(2)}) {
      color = u_colors[${N - 1}];
      break;
    }
    if (value < (float(i) + 1.5) / ${N.toFixed(2)}) {
      color = u_colors[i];
      break;
    }
  }

  gl_FragColor = vec4(color, 1.0);
}
        `;
