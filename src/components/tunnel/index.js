import { SUPPORT_OFFSCREEN_CANVAS_WEBGL } from "engine/constants";

import OffScreenTunnel from "./offscreen";

import OnScreenTunnel from "./onscreen";

class Tunnel {
  constructor() {}

  async load(opts = {}) {
    if (this.instance == null) {
      if (SUPPORT_OFFSCREEN_CANVAS_WEBGL) {
        this.instance = new OffScreenTunnel();

        await this.instance.init();
      } else {
        this.instance = new OnScreenTunnel();
      }
    }

    return this.instance;
  }

  get() {
    return this.instance;
  }
}

export default new Tunnel();
