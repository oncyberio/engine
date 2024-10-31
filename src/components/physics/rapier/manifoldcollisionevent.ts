import type { TempContactManifold } from "@dimforge/rapier3d";
import type { Component3D } from "engine/abstract/component3D";
import { CollisionEnterEvent, ContactPoint } from "./constants";
import type PhysicsRapierWrapper from "./wrapper";
import { Vector3 } from "three";

export class ManifoldCollisionEvent implements CollisionEnterEvent {
  //
  constructor(
    private _physics: PhysicsRapierWrapper,
    public readonly me: Component3D,
    public readonly other: Component3D,
    public readonly frame: number
  ) {}

  private _contactPoints: ContactPoint[] | null = null;

  get contactPoints() {
    //
    if (this._contactPoints !== null) {
      return this._contactPoints;
    }
    //
    if (this._physics.frame !== this.frame) {
      //
      throw new Error(
        "The frame number of the collision event does not match the current frame number of the physics world."
      );
    }

    let contactPoints: ContactPoint[] = [];

    const source1 = this.me.collider._collider;

    const source2 = this.other.collider._collider;

    this._physics.world.contactPair(source1, source2, (manifold, flipped) => {
      try {
        //

        const numPoints = manifold.numContacts();

        let normal = new Vector3().copy(manifold.normal() as any);

        for (let i = 0; i < numPoints; i++) {
          //
          const position = new Vector3().copy(
            manifold.localContactPoint1(i) as any
          );

          const reference = flipped ? this.other : this.me;

          position
            .applyQuaternion(reference.quaternion)
            .add(reference.position);

          contactPoints.push({
            position,
            normal,
            depth: manifold.contactDist(i),
          });
        }
        //
      } catch (e) {
        debugger;
      }
    });

    this._contactPoints = contactPoints;

    return contactPoints;
  }

  forEachManifold(
    cb: (manifold: TempContactManifold, flipped: boolean) => void
  ) {
    //
    const source1 = this.me.collider._collider;

    const source2 = this.other.collider._collider;

    this._physics.world.contactPair(source1, source2, cb);
  }
}
