// combine a noise and a palette to form a heatmap-like texture

const timeSpeed = 0.02; // animation speed

var renderShader = `
 precision mediump float;
    
    uniform sampler2D u_texture0;
    uniform sampler2D u_texture1;
    uniform highp float u_time;

    varying vec2 v_uv;

    vec4 sampleColorFromPalette(vec4 tex1) {
      float x = fract((tex1.r + tex1.g / 255.0) + ${Math.random()} + u_time * ${timeSpeed.toFixed(
  4
)});
      return texture2D(u_texture1, vec2(x, 0.5));
    }

    // combine textures using some operations
    vec4 combineTextures(vec2 st) {
        vec4 tex1 = texture2D(u_texture0, st);
        vec4 tex2 = sampleColorFromPalette(tex1);
        return tex2;
    }
        
            
    void main() {
      vec2 st = v_uv;
      vec4 color = combineTextures(st);
  
      gl_FragColor = color; 
  }
      `;
