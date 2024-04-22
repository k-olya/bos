import { Bos } from "bos";
import { TexturePixels, createTexture } from "./gl-utils";

// provides api for rendering to a texture
// TODO: add autoresize
// TODO: add depth support
export class FramebufferTexture {
  // framebuffer object
  framebuffer: WebGLFramebuffer;
  // texture object
  texture: WebGLTexture;
  // texture width
  width: number;
  // texture height
  height: number;
  // webgl context
  gl: WebGL2RenderingContext;

  constructor(bos: Bos, options?: FramebufferTextureOptions) {
    const gl = bos.gl;
    this.gl = gl;
    const opts: Required<FramebufferTextureOptions> = {
      image: null,
      textureWidth: bos.width,
      textureHeight: bos.height,
      textureFilter: gl.LINEAR,
      ...options,
    };
    this.framebuffer = gl.createFramebuffer()!;
    this.texture = createTexture(
      gl,
      gl.TEXTURE0,
      opts.textureWidth,
      opts.textureHeight,
      {
        pixels: opts.image,
        minFilter: opts.textureFilter,
        magFilter: opts.textureFilter,
        wrapS: gl.CLAMP_TO_EDGE,
        wrapT: gl.CLAMP_TO_EDGE,
      }
    );
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      this.texture,
      0
    );
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.width = opts.textureWidth;
    this.height = opts.textureHeight;
  }
  // set new width and height
  resize(width: number, height: number) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      width,
      height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null
    );
    gl.bindTexture(gl.TEXTURE_2D, null);
  }
  // free all gpu-related resources
  free() {
    const gl = this.gl;
    gl.deleteFramebuffer(this.framebuffer);
    gl.deleteTexture(this.texture);
  }
}

export interface FramebufferTextureOptions {
  // initial image
  image?: TexturePixels | null;
  textureWidth?: number;
  textureHeight?: number;
  // gl.LINEAR or gl.NEAREST
  textureFilter?: number;
}
