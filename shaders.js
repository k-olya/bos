const vertexShaderSource = (a, v) => `
    attribute mat4 a_all;
    ${v}
    varying vec2 v_uv;
    varying float v_alpha;
    
    uniform float u_time;

    void main() {
        vec2 c = a_all[0].xy;
        vec2 scale = a_all[0].ba;
        float rot = a_all[1][0];
        float alpha = a_all[1][1];
        vec2 uv = a_all[1].ba;
        vec2 pos = a_all[2].xy;

        ${a}

        v_uv = uv;
        v_alpha = alpha;
        gl_Position = vec4(pos, 0.0, 1.0);
    }

`;

const fragmentShaderSource = `
    precision mediump float;
    uniform sampler2D u_texture;

    varying vec2 v_uv;
    varying float v_alpha;

    void main() {
        vec2 st = v_uv;
        vec4 col = texture2D(u_texture, st);
        gl_FragColor = vec4(col.xyz, col.a * v_alpha);
    }
`;

const Shaders = function () {};

Shaders.prototype.vertex = function (animationCode, customVars) {
  return vertexShaderSource(animationCode || "", customVars || "");
};

Shaders.prototype.fragment = function (custom) {
  return custom || fragmentShaderSource;
};

var shaders = new Shaders();
