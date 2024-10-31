import { CollisionInfo } from "engine/@types/collider";
import { GROUPS, RIGIDBODY_TYPES } from "../constants";

import Layers from "../utils/layers";

import PhysicsRapierWrapper from "../wrapper";

import { Collider } from "./collider";

import { Component3D } from "engine/abstract/component3D";

export class Colliders {
  //
  public collidersArray: Array<Component3D> = [];

  public playerColliders: Array<Component3D> = [];

  public layers = null;

  public ids = 0;

  constructor(private engine: PhysicsRapierWrapper) {
    //
    this.layers = new Layers();

    this.layers.addGroup([
      GROUPS.PLAYERS,
      GROUPS.COLLIDERS,
      GROUPS.PORTALS,
      GROUPS.NONE,
    ]);
  }

  add(colliderInfo: CollisionInfo) {
    //
    if (colliderInfo.rigidbodyType === RIGIDBODY_TYPES.KINEMATIC) {
      // debugger;
    }

    const mesh = colliderInfo.mesh;

    const collider = new Collider(this.engine).get(colliderInfo);

    this.collidersArray.push(mesh);

    if (collider.name === "PLAYER") {
      this.playerColliders.push(mesh);
    }

    return collider;
  }
}
