import Sky from "./skyobject.js";

import { Vector3, MathUtils, Scene } from "three";

export const TYPES = {
  default: {
    turbidity: 10,
    rayleigh: 3,
    mieCoefficient: 0.005,
    mieDirectionalG: 0.7,
    elevation: 2,
    azimuth: 180,
  },

  bluesky: {
    turbidity: 7,
    rayleigh: 0.116,
    mieCoefficient: 0.005,
    mieDirectionalG: 0.779,
    elevation: 90,
    azimuth: 180,
  },

  greysky: {
    turbidity: 4.8,
    rayleigh: 4,
    mieCoefficient: 0,
    mieDirectionalG: 0.324,
    elevation: 24.7,
    azimuth: -50.1,
    toneMapping: "ACESFilmicToneMapping",
  },
};

class SkyFactory {
  getOptions(opts, skyOptions = null) {
    var config = TYPES[opts] || TYPES["default"];

    if (skyOptions) {
      config = skyOptions;
    }

    return config;
  }

  get(opts, skyOptions = null) {
    let sky, sun;

    sky = new Sky();

    sky.scale.setScalar(450000);

    sun = new Vector3();

    const config = this.getOptions(opts, skyOptions);

    const uniforms = sky.material.uniforms;
    uniforms["turbidity"].value = config.turbidity;
    uniforms["rayleigh"].value = config.rayleigh;
    uniforms["mieCoefficient"].value = config.mieCoefficient;
    uniforms["mieDirectionalG"].value = config.mieDirectionalG;

    const phi = MathUtils.degToRad(90 - config.elevation);
    const theta = MathUtils.degToRad(config.azimuth);

    sun.setFromSphericalCoords(1, phi, theta);

    uniforms["sunPosition"].value.copy(sun);

    // exposure: renderer.toneMappingExposure

    if (config.toneMapping != null) {
      sky.material.defines[config.toneMapping] = "1.0";
    }

    return sky;
  }

  dispose(scene) {
    scene.geometry.dispose();
    scene.material.dispose();

    scene = null;
  }
}

export default new SkyFactory();
