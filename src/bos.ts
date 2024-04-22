import {
  createProgram,
  createShader,
  createTexture,
  createVertexBuffer,
  getUniformLocations,
} from "./gl-utils";
import { Layer, LayerOptions } from "./layer";
import { FramebufferTexture } from "./framebuffer-texture";

// there are no options in the current implementation
export interface BosOptions {}

export class Bos {
  // webgl context
  gl: WebGL2RenderingContext;
  // canvas width
  width: number;
  // canvas height
  height: number;
  // layers
  layers: Layer[];
  constructor(
    gl: WebGL2RenderingContext,
    width: number,
    height: number,
    options?: BosOptions
  ) {
    const opts = {
      ...options,
    };
    this.gl = gl;
    this.width = width;
    this.height = height;
    this.layers = [];
    // enable alpha blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }
  // add new layer
  addLayer(opts: Partial<LayerOptions>): Layer {
    const layer = new Layer(this, opts);
    this.layers.push(layer);
    return layer;
  }
  // render all visible layers
  render(time: number) {
    const gl = this.gl;
    // this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    // this.gl.viewport(0, 0, this.width, this.height);
    // this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    for (let i = 0; i < this.layers.length; i++) {
      if (this.layers[i].visible) {
        this.layers[i].render(time);
      }
    }
  }
  // update width and height, also resize all auto-resize layers
  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    // resize all auto-resize layers
    for (let i = 0; i < this.layers.length; i++) {
      if (this.layers[i].autoResize) {
        this.layers[i].resize(width, height);
      }
    }
  }
  // convert canvas coordinates to gl coordinate
  canvasXtoGl(x: number, aspect?: number): number {
    return ((x / this.width) * 2 - 1) / (aspect || 1);
  }
  canvasYtoGl(y: number): number {
    return 1 - (y / this.height) * 2;
  }

  // utils
  static Utils = {
    createProgram,
    createShader,
    createTexture,
    createVertexBuffer,
    getUniformLocations,
  };
  // export classes
  static FramebufferTexture = FramebufferTexture;
  static Layer = Layer;
}

export default Bos;
