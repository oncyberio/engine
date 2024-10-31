import { PlatformerController } from "./platformer2controller";

class Platformer2Controls {
  get(opts) {
    return new PlatformerController(opts);
  }
}

export type { PlatformerControlParams as Platformer2ControlParams } from "./platformer2controller";

export default new Platformer2Controls();
