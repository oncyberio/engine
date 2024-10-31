import XShaderMat from "3D_threextend";

let glslify = require("glslify");

import { Texture, Color } from "three";

import ressources from "3D_ressources";

export default class StandardMaterial extends XShaderMat {
  constructor() {
    let opts = {
      vertexShaderHooks: {
        prefix: glslify("./shaders/vert.pre.glsl"),

        main: glslify("./shaders/vert.main.glsl"),

        suffix: glslify("./shaders/vert.suff.glsl"),
      },

      fragmentShaderHooks: {
        prefix: glslify("./shaders/frag.pre.glsl"),

        main: glslify("./shaders/frag.main.glsl"),

        suffix: glslify("./shaders/frag.suff.glsl"),
      },

      uniforms: {
        diffuse: {
          value: new Color(0xffffff),
        },
        metalness: { value: 0.6 },
        roughness: { value: 1 },
        transparent: true,
      },

      side: 0,

      defines: {},
    };

    super("standard", opts);
  }
}
