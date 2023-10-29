var vertexShaderSource = `

`;

var fragmentShaderSource = `
    precision mediump float;
    uniform sampler2D u_texure;
    uniform mediump vec2 u_resolution;
    uniform float u_opacity;

    varying vec2 v_uv;

    void main() {
        vec2 st = v_uv;
        vec4 col = texture2D(u_texture, st);
        gl_FragColor = vec4(col.xyz, col.a * u_opacity);
    }
`;
