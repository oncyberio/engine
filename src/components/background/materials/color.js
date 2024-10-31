import { ShaderMaterial, Color, BackSide } from "three";

import VertexShader from "./shaders/color-vert.glsl";

import FragmentShader from "./shaders/color-frag.glsl";

export default class ColorMaterial extends ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        color: {
          value: new Color(),
        },
      },

      vertexShader: VertexShader,

      fragmentShader: FragmentShader,

      fog: false,

      transparent: true,

      depthWrite: false,

      side: 0,
    });
  }

  setColor(color) {
    this.uniforms.color.value.set(color);
  }
}
