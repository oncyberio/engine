import PipeLineMesh from "engine/abstract/pipelinemesh";

import Triangle from "engine/globals/geometries/triangle";

import ColorMaterial from "./materials/color.js";

export class ColorBackground extends PipeLineMesh {
  constructor(opts) {
    super(Triangle, new ColorMaterial(), opts.pipeLineOpts);

    this.isColor = true;

    this.material.setColor(opts.color ?? "#000");
  }

  updateOpts(opts) {
    this.material.setColor(opts.color);
  }
}
