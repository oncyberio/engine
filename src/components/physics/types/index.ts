import { Component3D } from "engine/abstract/component3D";
import { ColliderOpts } from ".";
import { RigidBodyOpts } from ".";

export * from "./collideropts";

export * from "./rigidbodyopts";

export * from "./events";

export interface PhysicsOpts {
  //
  component: Component3D;

  rigitBodyOpts: RigidBodyOpts;
}
