import { ShaderMaterial, Color } from "three";

import VertexShader from "./shaders/vert.glsl";

import FragmentShader from "./shaders/frag.glsl";

export default class DebugMaterial extends ShaderMaterial {
  constructor(color = 0xffffff, opacity = 1) {
    let opts = {
      vertexShader: VertexShader,

      fragmentShader: FragmentShader,

      uniforms: {
        color: {
          value: new Color(color),
        },

        opacity: {
          value: opacity,
        },
      },

      transparent: true,

      side: 0,
    };

    super(opts);
  }
}
