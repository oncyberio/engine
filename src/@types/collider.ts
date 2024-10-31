import { Euler, Quaternion, TypedArray, Vector3 } from "three";

import {
  RIGIDBODY_TYPES,
  COLLIDER_TYPES,
  GROUPS,
} from "engine/components/physics/rapier/constants";
import { Component3D } from "engine/abstract/component3D";

export interface ColliderOpts {
  //
  rigidbodyType: keyof typeof RIGIDBODY_TYPES;

  colliderType: keyof typeof COLLIDER_TYPES;

  mass: number;

  friction: number;

  restitution: number;

  isSensor: boolean;

  density: number;

  groups: Array<number>;

  enabledTranslation?: [boolean, boolean, boolean];

  enabledRotation?: [boolean, boolean, boolean];

  // etc
}

export interface ColliderDimensionsMap {
  CUBE: {
    width: number;
    height: number;
    depth: number;
  };

  SPHERE: {
    radius: number;
    center: { x: number; y: number; z: number };
  };

  CAPSULE: {
    radius: number;
    height: number;
    center: { x: number; y: number; z: number };
  };

  CYLINDER: {
    radius: number;
    height: number;
    center: { x: number; y: number; z: number };
  };

  MESH: null;
}

export interface CollisionInfo extends ColliderOpts {
  mesh: Component3D;

  position: Vector3;
  quaternion: Quaternion;
  scale: Vector3;
  dimensions: ColliderDimensionsMap[this["colliderType"]];
  vertices?: TypedArray;
  indices?: TypedArray;
}
