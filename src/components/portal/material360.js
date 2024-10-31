import VertexShader from "./shaders/vert.glsl";

import FragmentShader from "./shaders/frag.glsl";

import { ShaderMaterial, UniformsLib } from "three";

import Shared from "engine/globals/shared";

export default class Three60Material extends ShaderMaterial {
  constructor(opts) {
    super({
      vertexShader: VertexShader,

      fragmentShader: FragmentShader,

      fog: true,

      uniforms: {
        loading: {
          value: 0,
        },

        scaleFactor: {
          value: 1,
        },

        map: {
          value: opts.map,
        },

        resolution: Shared.resolution,

        dpi: Shared.dpi,

        rotation: {
          value: 0,
        },

        timer: Shared.timer,
      },

      side: 2,
    });

    this.lights = true;

    this.uniforms = Object.assign(this.uniforms, UniformsLib.fog);
    this.uniforms = Object.assign(this.uniforms, UniformsLib.lights);

    if (opts.halo != undefined) {
      this.defines = [];

      this.defines["HALO_" + opts.halo.toUpperCase()] = "";
    }
  }
}
