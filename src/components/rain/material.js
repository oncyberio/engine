// @ts-check

import { ShaderMaterial } from "three";

import VertexShader from "./shaders/vert.glsl";

import FragmentShader from "./shaders/frag.glsl";

import Shared from "engine/globals/shared";

import { UniformsLib } from "three";

export default class RainMaterial extends ShaderMaterial {
  constructor(opt) {
    let opts = {
      vertexShader: VertexShader,

      fragmentShader: FragmentShader,

      uniforms: {
        timer: Shared.timer,

        invaspect: Shared.invaspect,

        invresolution: Shared.invresolution,

        intensity: {
          value: opt.intensity,
        },

        // fog: Shared.fog
      },

      blending: 2,

      depthWrite: false,

      defines: {},

      fog: false,

      transparent: true,

      side: 0,
    };

    opts.uniforms = Object.assign(opts.uniforms, UniformsLib.fog);

    // if( USE_FOG ) {

    //     opts.uniforms.fogNear      =  UniformsLib[ "fog" ].fogNear

    //     opts.uniforms.fogFar       =  UniformsLib[ "fog" ].fogFar

    //     opts.uniforms.fogColor     =  UniformsLib[ "fog" ].fogColor

    // }
    // addAsDefine(opts, 'fog')

    super(opts);
  }
}
