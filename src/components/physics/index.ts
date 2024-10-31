// import PhysicsCannon  from "./cannon"

import PhysicsRapier from "./rapier";

/**
 * Physics manager
 *
 * @internal
 */
export class PhysicsManager {
  private rapier = null;

  constructor() {}

  get(opts: {
    type: "rapier";
    debug: boolean;
  }): ReturnType<typeof PhysicsRapier.get> {
    if (this.rapier) {
      //
      return this.rapier;
    }

    this.rapier = PhysicsRapier.get(opts);

    return this.rapier;
  }

  dispose() {
    if (this.rapier == null) return;

    this.rapier.dispose();

    this.rapier = null;
  }
}

export const Physics = new PhysicsManager();
