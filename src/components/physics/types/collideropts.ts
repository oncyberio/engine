export type ColliderType =
  | "CUBE"
  | "SPHERE"
  | "CAPSULE"
  | "CYLINDER"
  | "CONE"
  | "MESH";

export interface BaseColliderOpts {
  //
  position?: { x: number; y: number; z: number };

  // rotation?: { x: number; y: number; z: number; w: number };

  /**
   * The mass of the rigid body
   */
  mass?: number;

  /**
   * The friction of the rigid body
   */
  friction?: number;

  /**
   * The restitution of the rigid body
   */
  restitution?: number;

  /**
   * The density of the rigid body
   */
  density?: number;

  /**
   * If this is true, the collider will be a sensor
   */
  isSensor?: boolean;

  groups?: number;
}

export interface SphereColliderOpts extends BaseColliderOpts {
  type: "SPHERE";
  radius: number;
}

export interface CubeColliderOpts extends BaseColliderOpts {
  type: "CUBE";
  width: number;
  height: number;
  depth: number;
}

export interface CapsuleColliderOpts extends BaseColliderOpts {
  type: "CAPSULE";
  radius: number;
  height: number;
}

export interface CylinderColliderOpts extends BaseColliderOpts {
  type: "CYLINDER";
  radius: number;
  height: number;
}

export interface ConeColliderOpts extends BaseColliderOpts {
  type: "CONE";
  radius: number;
  height: number;
}

export interface MeshColliderOpts extends BaseColliderOpts {
  type: "MESH";
  vertices: Float32Array;
  indices: Uint32Array;
}

export type ColliderOpts =
  | CubeColliderOpts
  | SphereColliderOpts
  | CapsuleColliderOpts
  | CylinderColliderOpts
  | MeshColliderOpts;
