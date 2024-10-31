import LightingWrapper from "./wrapper.js";

class Lighting {
  constructor() {}

  get(opts, scene) {
    return new LightingWrapper(opts, scene);
  }
}

export default new Lighting();
