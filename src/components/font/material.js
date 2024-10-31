// @ts-check

import { ShaderMaterial, Vector3, UniformsLib } from "three";

import {
  DPI,
  FONT_DISTANCE_RANGE_FIELD,
  GLOBAL_TEXT_SCALE,
} from "engine/constants";

import VertexShader from "./shader/main.vert";

import FragmentShader from "./shader/main.frag";

let defaultOptions = {
  // light 		: false,

  alpha: 1,
};

// import addAsDefine from 'utils/addasdefine.js'

export default class MSDFMaterial extends ShaderMaterial {
  constructor(options = {}) {
    let nOptions = Object.assign({}, defaultOptions);

    nOptions = Object.assign(nOptions, options);

    let opts = {
      name: "MSDFMaterial",

      uniforms: {
        alpha: { value: nOptions.alpha },

        map: { value: nOptions.map },
      },

      vertexShader: VertexShader,

      fragmentShader: FragmentShader,

      side: 2,

      extensions: {
        derivatives: true,
      },

      // https://github.com/Blatko1/awesome-msdf/tree/main/shaders

      defines: {
        msdfUnit_X: 6 / nOptions.map.image.width,

        msdfUnit_Y: 6 / nOptions.map.image.height,

        alphaTest: 0.001,

        GLOBAL_TEXT_SCALE: GLOBAL_TEXT_SCALE,
      },

      transparent: true,

      fog: true,
    };

    if (DPI == 1) {
      opts.defines["DPI_1"] = 1;
    }

    if (options.instanced == true) {
      opts.defines["INSTANCED"] = "";
    }

    if (options.billboard) {
      opts.defines["BILLBOARD"] = "";
    }

    opts.uniforms = Object.assign(opts.uniforms, UniformsLib.fog);

    super(opts);

    this.opts = opts;

    this.occlusionMaterial = new ShaderMaterial(opts);

    // opts.defines['DEPTH'] = ''

    // if( options.instanced != true ) {

    //     var optss =  {
    //         uniforms: {
    //             alpha: { value: nOptions.alpha },

    //             map: { value: nOptions.map },
    //         },

    //         vertexShader: VertexShader,

    //         fragmentShader: FragmentShader,

    //         side: 2,

    //         extensions: {
    //             derivatives: true,
    //         },

    //         defines: {
    //             msdfUnit_X:
    //                 (DPI * FONT_DISTANCE_RANGE_FIELD) /
    //                 nOptions.map.image.width,

    //             msdfUnit_Y:
    //                 (DPI * FONT_DISTANCE_RANGE_FIELD) /
    //                 nOptions.map.image.height,

    //             alphaTest: "" + parseFloat(0.001).toFixed(5) + "",

    //             GLOBAL_TEXT_SCALE: GLOBAL_TEXT_SCALE
    //         },

    //         transparent: true,

    //         fog: false,
    //     };

    //     if (DPI == 1) {
    //         optss.defines["DPI_1"] = 1;
    //     }

    //     optss.defines['DEPTH'] = ''

    //     this.customDepthMaterial = new ShaderMaterial(optss)

    // }
  }

  set alpha(val) {
    this.uniforms.alpha.value = val;
  }

  get alpha() {
    return this.uniforms.alpha.value;
  }
}
