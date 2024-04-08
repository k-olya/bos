// generates perlin noise texture

const fbmAmplitudeDecay = 0.35; // influences noise shape
const scale = 2.4; // noise zoom level
var noiseShader = `
     precision mediump float;
    
  varying vec2 v_uv; 
float random (vec2 st) {
  return fract(sin(${Math.random().toFixed(
    2
  )} * dot(st.xy, vec2(12.98,78.233))));
}

float noise (vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);

  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));

  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm (vec2 st) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 0.0;

  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(st);
    st *= 2.0;
    amplitude *= ${fbmAmplitudeDecay.toFixed(2)};
  }

  return value;
}

vec4 floatToColor(float v) {
  float value = v * 255.0;
  float high = floor(value) / 255.0;
  float low = fract(value);
  return vec4(high, low, 0.0, 1.0);
}

void main() {
  vec2 st = v_uv;
  st *= ${scale.toFixed(2)};

  float v = fbm(st);
  
  gl_FragColor = floatToColor(v);
}
        `;
