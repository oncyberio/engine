import type { Component3D } from "engine/abstract/component3D";
import { Vector3 } from "three";

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
