import { ColliderOpts } from "./collideropts";

export type RigidBodyType = "DYNAMIC" | "KINEMATIC" | "PLAYER" | "FIXED";

export interface RigidBodyOpts {
  type: RigidBodyType;
  position: { x: number; y: number; z: number };
  quaternion: { x: number; y: number; z: number; w: number };
  translationLock?: [boolean, boolean, boolean];
  rotationLock?: [boolean, boolean, boolean];
  colliders: ColliderOpts[];
}
