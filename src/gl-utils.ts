// helper functions for webgl
export type GLContext = WebGLRenderingContext | WebGL2RenderingContext;
export type TexturePixels =
  | ImageData
  | HTMLImageElement
  | HTMLCanvasElement
  | HTMLVideoElement
  | ImageBitmap
  | ArrayBufferView;

export interface TextureOptions {
  framebuffer?: WebGLFramebuffer;
  pixels?: TexturePixels | null;
  minFilter?: number;
  magFilter?: number;
  wrapS?: number;
  wrapT?: number;
  flip?: boolean;
  premultiply?: boolean;
}

// create and compile a shader
export function createShader(
  gl: GLContext,
  type: number,
  source: string
): WebGLShader | null {
  var shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const status = "Shader compilation error: " + gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(status);
  }

  return shader;
}

// create and link a program
export function createProgram(
  gl: GLContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
): WebGLProgram | null {
  var program = gl.createProgram()!;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const status = "Program linking error: " + gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(status);
  }

  return program;
}

// create and configure a texture
export function createTexture(
  gl: GLContext,
  glTexture: number,
  width: number,
  height: number,
  options: TextureOptions
): WebGLTexture {
  const opts = {
    framebuffer: null,
    pixels: null,
    minFilter: gl.LINEAR,
    magFilter: gl.LINEAR,
    wrapS: gl.CLAMP_TO_EDGE,
    wrapT: gl.CLAMP_TO_EDGE,
    flip: false,
    premultiply: false,
    ...options,
  };
  var texture = gl.createTexture()!;
  gl.activeTexture(glTexture);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  if (opts.flip) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  }
  if (opts.premultiply) {
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  }
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    width,
    height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    // @ts-ignore
    opts.pixels || null
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, opts.minFilter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, opts.magFilter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, opts.wrapS);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, opts.wrapT);

  if (opts.framebuffer) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, opts.framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0
    );
  }

  return texture;
}

// full-screen triangle strip
export const defaultVertices = [
  -1.0,
  -1.0, // Bottom left corner
  1.0,
  -1.0, // Bottom right corner
  -1.0,
  1.0, // Top left corner
  1.0,
  1.0, // Top right corner
];

// create a vertex buffer
export function createVertexBuffer(
  gl: GLContext,
  vertices?: number[]
): WebGLBuffer {
  var buffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    vertices ? new Float32Array(vertices) : null,
    gl.STATIC_DRAW
  );
  return buffer;
}

// pass current ARRAY_BUFFER to the vertex shader
export function enableVertexBuffer(
  gl: GLContext,
  attribLocation: number,
  options?: any
): void {
  const opts = {
    buffer: null,
    size: 2,
    ...options,
  };
  if (opts.buffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, opts.buffer);
  }
  gl.enableVertexAttribArray(attribLocation);
  gl.vertexAttribPointer(attribLocation, opts.size, gl.FLOAT, false, 0, 0);
}

// fill entire screen
export function fillFramebuffer(
  gl: GLContext,
  width: number,
  height: number,
  framebuffer?: WebGLFramebuffer
): void {
  const _framebuffer: WebGLFramebuffer | null =
    typeof framebuffer === "undefined" ? null : framebuffer;
  gl.bindFramebuffer(gl.FRAMEBUFFER, _framebuffer);
  gl.viewport(0, 0, width, height);
  // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

// get all attribute and uniform locations at once in a nice little object
export function getAttribLocations(
  gl: GLContext,
  program: WebGLProgram,
  ...args: string[]
): { [key: string]: number } {
  return args.reduce(
    (a, v) => ({ ...a, [v]: gl.getAttribLocation(program, v) }),
    {}
  );
}
export function getUniformLocations(
  gl: GLContext,
  program: WebGLProgram,
  ...args: string[]
): { [key: string]: WebGLUniformLocation | null } {
  return args.reduce(
    (a, v) => ({ ...a, [v]: gl.getUniformLocation(program, v) }),
    {}
  );
}
