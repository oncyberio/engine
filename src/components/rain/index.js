import Rain from "./rain.js";

class RainFactory {
  constructor() {}

  get(opts) {
    return new Rain(opts);
  }
}

export default new RainFactory();
