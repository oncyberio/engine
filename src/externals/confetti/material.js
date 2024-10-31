import { ShaderMaterial } from "three";

import vertexShader from "./shaders//vert.glsl";

import fragmentShader from "./shaders/frag.glsl";

export default class ConfettiMaterial extends ShaderMaterial {
  constructor(limit, type) {
    var opts = {
      vertexShader,

      fragmentShader,

      defines: {
        LOOP: "" + parseFloat(limit + 0.0001) + "",
      },

      uniforms: {
        timer: {
          value: 0,
        },
      },

      side: 2,

      transparent: true,
    };

    opts.defines[type] = "1.0";
    opts.defines.BASE_SEED = Math.random() * 1000;

    super(opts);
  }

  set timer(val) {
    this.uniforms.timer.value = val;
  }

  get timer() {
    return this.uniforms.timer.value;
  }
}
