import { Sprite } from "./types";

export const uniformTypes = {
  "lowp float": "uniform1f",
  "mediump float": "uniform1f",
  "highp float": "uniform1f",
  float: "uniform1f",
  vec2: "uniform2f",
  "lowp vec2": "uniform2f",
  "mediump vec2": "uniform2f",
  "highp vec2": "uniform2f",
  vec3: "uniform3f",
  "lowp vec3": "uniform3f",
  "mediump vec3": "uniform3f",
  "highp vec3": "uniform3f",
  "float[]": "uniform1fv",
  "lowp float[]": "uniform1fv",
  "mediump float[]": "uniform1fv",
  "highp float[]": "uniform1fv",
  "vec2[]": "uniform2fv",
  "lowp vec2[]": "uniform2fv",
  "mediump vec2[]": "uniform2fv",
  "highp vec2[]": "uniform2fv",
  "vec3[]": "uniform3fv",
  "lowp vec3[]": "uniform3fv",
  "mediump vec3[]": "uniform3fv",
  "highp vec3[]": "uniform3fv",
};

export const vertices: [number, number, string, string][] = [
  // bottom left corner
  [-0.5, -0.5, "uvleft", "uvbottom"],
  // bottom right corner
  [0.5, -0.5, "uvright", "uvbottom"],
  // top left corner
  [-0.5, 0.5, "uvleft", "uvtop"],

  // top left corner
  [-0.5, 0.5, "uvleft", "uvtop"],
  // bottom right corner
  [0.5, -0.5, "uvright", "uvbottom"],
  // top right corner
  [0.5, 0.5, "uvright", "uvtop"],
];
export const attrOrder: Array<keyof Sprite> = [
  "x",
  "y",
  "scalex",
  "scaley",
  "rot",
  "alpha",
  "u",
  "v",
];
