import type { Component3D } from "engine/abstract/component3D";
import { CollisionEnterEvent } from "./constants";
import type { CharacterCollision } from "@dimforge/rapier3d";
import { Vector3 } from "three";

const tmpVec = new Vector3();

/**
 * @public
 */
export class CharacterCollisionEvent implements CollisionEnterEvent {
  constructor(
    public flipped: boolean,
    public readonly me: Component3D,
    public readonly other: Component3D,
    public readonly characterCollision: CharacterCollision,
    public readonly frame: number
  ) {}

  get contactPoints() {
    //
    if (this.characterCollision == null) {
      //
      return [];
    }

    let position = new Vector3().copy(this.characterCollision.witness1 as any);

    let depth = tmpVec
      .copy(this.characterCollision.translationRemaining as any)
      .dot(this.characterCollision.normal1 as any);

    let normal = new Vector3().copy(this.characterCollision.normal1 as any);

    if (this.flipped) {
      normal.negate();
    }

    return [
      {
        position,
        normal,
        depth,
      },
    ];
  }
}
