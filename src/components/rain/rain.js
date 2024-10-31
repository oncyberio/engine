// @ts-check

import RainGeometry from "./geometry.js";

import RainMaterial from "./material.js";

import PipeLineMesh from "engine/abstract/pipelinemesh";

export default class RainMesh extends PipeLineMesh {
  constructor(opts) {
    let geometry = new RainGeometry();

    let material = new RainMaterial(opts);

    super(geometry, material, {
      // visibleOnOcclusion : false,

      visibleOnMirror: false,
    });

    this.frustumCulled = false;
  }

  get intensity() {
    return this.material.uniforms.intensity.value;
  }

  set intensity(v) {
    this.material.uniforms.intensity.value = v;
  }
}
