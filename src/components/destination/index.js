import Wrapper from "./wrapper.js";

class DestinationFactory {
  constructor() {}

  async get(opts) {
    this.wrapper = new Wrapper(opts);

    await this.wrapper.get();

    return this.wrapper;
  }

  dispose() {
    this.wrapper.dispose();
  }
}

export default new DestinationFactory();
