import type { Component3D } from "engine/abstract/component3D";
import { Vector3 } from "three";

export const GROUPS = {
  MAIN: 2,

  PLAYERS: 3,

  SENSORS: 4,

  COLLIDERS: 6,

  PORTALS: 9,

  NONE: 12,
};

export const PLAYER_SET_TYPES = {
  CAPSULE: "CAPSULE",

  POSITION: "POSITION",

  TELEPORT: "TELEPORT",
};

export const RIGIDBODY_TYPES = Object.freeze({
  DYNAMIC_PLAYER: "DYNAMIC_PLAYER",

  DYNAMIC: "DYNAMIC",

  KINEMATIC: "KINEMATIC",

  FIXED: "FIXED",

  PLAYER: "PLAYER",

  VEHICULE: "VEHICULE",
});

export const KINEMATIC_SET_TYPES = {
  POSITION: "POSITION",
};

export const COLLIDER_TYPES = {
  CUBE: "CUBE",

  MESH: "MESH",

  SPHERE: "SPHERE",

  CAPSULE: "CAPSULE",

  CYLINDER: "CYLINDER",
} as const;

export type ColliderType = "CUBE" | "MESH" | "SPHERE" | "CAPSULE" | "CYLINDER";

export type RigidBodyType = "DYNAMIC" | "KINEMATIC" | "FIXED" | "PLAYER";

/**
 * @public
 *
 * Base interface for all collision/sensor events.
 */
export interface BaseIntersectionEvent {
  /**
   * The component where the event was triggered
   */
  me: Component3D;

  /**
   * The other component involved in the collision
   */
  other: Component3D;

  /**
   * The frame number when the collision happened
   */
  frame: number;
}

/**
 * @public
 *
 * Payload for the collision enter event; see {@link {@link Component3D.onCollisionEnter}
 */
export interface CollisionEnterEvent extends BaseIntersectionEvent {
  /**
   * Iterator over the contact points of the collision.
   */
  readonly contactPoints: ContactPoint[];
}

/**
 * @public
 *
 * Payload for the collision exit event; see {@link {@link Component3D.onCollisionExit}
 */
export interface CollisionExitEvent extends BaseIntersectionEvent {}

export interface ContactPoint {
  /**
   * Position of the contact point.
   */
  position: Vector3;

  /**
   * Normal of the contact point.
   */
  normal: Vector3;

  /**
   * Depth of the contact point.
   */

  depth: number;
}

export interface SensorEvent extends BaseIntersectionEvent {}
