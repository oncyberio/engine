import PhysicsRapierWrapper from "./wrapper";

class PhysicsRapier {
  constructor() {}

  get(opts) {
    return new PhysicsRapierWrapper(opts);
  }
}

export default new PhysicsRapier();
