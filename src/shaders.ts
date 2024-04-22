// return the source of the vertex shader
export const vertexShaderSource = (
  a: string, // animation code
  v: string, // varying
  u: string, // uniforms
  precision?: string, // highp, mediump or lowp
  custom?: string // custom shader
) => {
  let r =
    custom ||
    `
    // bos's default customizable vertex shader
    attribute mat4 a_all;
    varying vec2 v_uv;
    varying float v_alpha;
    
    // custom varying
    ${v || ""}
    // custom uniforms
    ${u || ""}
    // end of custom variable declarations
   
    // time is always highp
    uniform highp float u_time;
    uniform vec2 u_aspect;

    void main() {
        vec2 c = a_all[0].xy;
        vec2 scale = a_all[0].ba;
        float rot = a_all[1][0];
        float alpha = a_all[1][1];
        vec2 uv = a_all[1].ba;
        vec2 pos = a_all[2].xy;

        float custom0 = a_all[2][2];
        float custom1 = a_all[2][3];
        float custom2 = a_all[3][0];
        float custom3 = a_all[3][1];
        float custom4 = a_all[3][2];
        float custom5 = a_all[3][3];

        // custom animation code goes here
        ${a || ""}
        // end of custom animation code

        // rotate
        float _sin = sin(rot);
        float _cos = cos(rot);
        mat2 rotationMatrix = mat2(_cos, _sin, -_sin, _cos);
        pos = rotationMatrix * pos;

        // scale and translate
        pos = pos * scale + c;

        // apply aspect ratio
        pos *= u_aspect;

        v_uv = uv;
        v_alpha = alpha;
        gl_Position = vec4(pos, 0.0, 1.0);
    }

`;
  if (!custom && precision) r = `precision ${precision} float;` + r;
  // console.log(r);
  return r;
};

// return the source of the fragment shader
export const fragmentShaderSource = (
  custom: string /* custom shader */,
  precision?: string /* highp, mediump or lowp */
) => {
  let r =
    custom ||
    `
    // bos's default fragment shader
    uniform sampler2D u_texture0;

    varying vec2 v_uv;
    varying float v_alpha;

    void main() {
        vec2 st = v_uv;
        vec4 col = texture2D(u_texture0, st);
        gl_FragColor = vec4(col.xyz, col.a * v_alpha);
    }
`;
  if (!custom && precision) r = `precision ${precision} float;` + r;
  return r;
};
