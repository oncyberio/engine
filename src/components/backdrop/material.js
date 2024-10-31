import { ShaderMaterial } from "three";

import VertexShader from "./shaders/vertex.glsl";

import FragmentShader from "./shaders/frag.glsl";

import Shared from "engine/globals/shared";

import { Color } from "three";

const DEFAULT_OPTIONS = {
  floor: 0xceb7e7,
  horizon: 0xceb7e7,
  wall: 0x7e24c3,
  top: 0x7e24c3,
  step1: 0,
  step2: 0.2,
  step3: 0.6,
  step4: 1.0,
};

const tempC0 = new Color();
const tempC1 = new Color();
const tempC2 = new Color();
const tempC3 = new Color();

export default class BackDropMaterial extends ShaderMaterial {
  constructor(op) {
    var data = Object.assign({}, DEFAULT_OPTIONS, op.options);

    let opts = {
      side: 2,

      vertexShader: VertexShader,

      fragmentShader: FragmentShader,

      transparent: true,

      fog: false,

      uniforms: {
        floor: {
          value: new Color(data.floor),
        },

        wall: {
          value: new Color(data.wall),
        },

        horizon: {
          value: new Color(data.horizon),
        },

        top: {
          value: new Color(data.top),
        },

        step1: {
          value: data.step1,
        },
        step2: {
          value: data.step2,
        },
        step3: {
          value: data.step3,
        },
        step4: {
          value: data.step4,
        },

        DPI: Shared.dpi,

        timer: Shared.timer,
      },
    };

    super(opts);
  }

  setColors(options) {
    var data = Object.assign({}, DEFAULT_OPTIONS, options);

    this.uniforms.floor.value.setHex(data.floor);
    this.uniforms.wall.value.setHex(data.wall);
    this.uniforms.horizon.value.setHex(data.horizon);
    this.uniforms.top.value.setHex(data.top);

    this.uniforms.step1.value = data.step1;
    this.uniforms.step2.value = data.step2;
    this.uniforms.step3.value = data.step3;
    this.uniforms.step4.value = data.step4;
  }

  setColorsWithTransition(options, duration = 1) {
    return new Promise((resolve, reject) => {
      var ps = [];

      var data = Object.assign({}, DEFAULT_OPTIONS, options);

      tempC0.setHex(options.floor);
      tempC1.setHex(options.wall);
      tempC2.setHex(options.horizon);
      tempC3.setHex(options.top);

      ps.push(
        this.transitionFromTo(this.uniforms.floor.value, tempC0, duration)
      );
      ps.push(
        this.transitionFromTo(this.uniforms.wall.value, tempC1, duration)
      );
      ps.push(
        this.transitionFromTo(this.uniforms.horizon.value, tempC2, duration)
      );
      ps.push(this.transitionFromTo(this.uniforms.top.value, tempC3, duration));

      Promise.all(ps).then(() => {
        resolve();
      });
    });
  }

  transitionFromTo(from, to, duration) {
    // TBD
  }
}
