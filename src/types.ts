// all supported uniform types
export type UniformValue =
  | number
  | number[]
  | Float32Array
  | Int32Array
  | Float64Array
  | Uint32Array
  | Uint16Array
  | Uint8Array
  | Int16Array
  | Int32Array;

// float precision type
export type FloatPrecision = "highp" | "mediump" | "lowp" | null;

// uniform locations type
export type UniformLocations = { [key: string]: WebGLUniformLocation | null };

// sprite interface
// it's not a real class, because sprites are written directly to the webgl buffer
export interface Sprite {
  x?: number;
  y?: number;
  scalex?: number;
  scaley?: number;
  rot?: number;
  alpha?: number;
  u: number;
  v: number;
  w: number;
  h: number;
  custom?: number[];
}
