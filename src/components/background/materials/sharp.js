import { ShaderMaterial, Color, BackSide } from "three";

import VertexShader from "./shaders/sharp-vert.glsl";

import FragmentShader from "./shaders/sharp-frag.glsl";

export default class SharpMaterial extends ShaderMaterial {
  constructor(opts) {
    super({
      uniforms: {
        map: {
          value: opts.map,
        },
      },

      vertexShader: VertexShader,

      fragmentShader: FragmentShader,

      fog: false,

      transparent: false,

      depthWrite: false,

      side: 1,
    });
  }
}
