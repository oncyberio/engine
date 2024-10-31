import VertexShader from "./shaders/vert2D.glsl";

import FragmentShader from "./shaders/frag2D.glsl";

import { ShaderMaterial } from "three";

import Shared from "engine/globals/shared";

export default class TwoDMaterial extends ShaderMaterial {
  constructor(opts) {
    super({
      vertexShader: VertexShader,

      fragmentShader: FragmentShader,

      uniforms: {
        map: {
          value: opts.map,
        },

        aspect: {
          value: 1,
        },

        resolution: Shared.resolution,
      },

      side: 2,
    });
  }
}
