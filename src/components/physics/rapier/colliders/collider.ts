import { ArrowHelper, Quaternion, TypedArray, Vector3 } from "three";

import Layers from "../utils/layers";

import type PhysicsRapierWrapper from "../wrapper";

import {
  COLLIDER_TYPES,
  ColliderType,
  GROUPS,
  RIGIDBODY_TYPES,
  RigidBodyType,
  CollisionEnterEvent,
  CollisionExitEvent,
  ContactPoint,
  BaseIntersectionEvent,
  SensorEvent,
} from "../constants";

import { CollisionInfo } from "engine/@types/collider";
import type {
  ColliderDesc,
  Collider as RapierCollider,
  RigidBody,
} from "@dimforge/rapier3d";
import { Component3D } from "engine/abstract/component3D";
import { CollisionFSM } from "../collisionFSM";

export type {
  ColliderType,
  RigidBodyType,
  BaseIntersectionEvent,
  CollisionEnterEvent,
  CollisionExitEvent,
  SensorEvent,
  ContactPoint,
};

/**
 * @public
 *
 * This class encapsulates the physics entities attached to a component (rigid body, collider).
 *
 * it offers some convenience methods to physics properties of the component.
 *
 * For more info on the underlying physics engine, cf {@link https://rapier.rs/docs/ | Rapier docs }
 */
export class Collider {
  /**
   * @internal
   */
  public _enabled = true;

  /**
   * @internal
   */
  public id: number;

  /**
   * Component's name this collider is attached to
   */
  public name: string;

  /**
   * Rapier collider instance, cf {@link https://rapier.rs/docs/user_guides/javascript/colliders/ | Rapier docs } for more info
   */
  public _collider: RapierCollider;

  /**
   * Collider type, cf {@link https://rapier.rs/docs/user_guides/javascript/colliders/ | Rapier docs } for more info on the meaning of different types
   */
  public colliderType: ColliderType;

  /**
   * Rigid body type, cf {@link https://rapier.rs/docs/user_guides/javascript/rigid_bodies/ | Rapier docs } for more info on the meaning of different types
   */
  public rigidbodyType: RigidBodyType;

  /**
   * Collider description, cf {@link https://rapier.rs/docs/user_guides/javascript/colliders/ | Rapier docs } for more info
   */
  public colliderDesc: ColliderDesc;

  /**
   * Rapier rigid body instance, cf {@link https://rapier.rs/docs/user_guides/javascript/rigid_bodies/ | Rapier docs } for more info
   */
  public rigidBody: RigidBody;

  private _isSensor: boolean;

  /**
   * @internal
   */
  public groups = [];

  /**
   * @internal
   */
  public mesh: Component3D;

  /**
   * @internal
   */
  public dimensions: {
    width: number;

    height: number;

    depth: number;

    radius: number;

    center: any;
  } = null;

  /**
   * @internal
   */
  public vertices: TypedArray;

  /**
   * @internal
   */
  public indices: TypedArray;

  /**
   * @internal
   */
  public scale: Vector3;

  /**
   * @internal
   */
  public quaternion: Quaternion;

  /**
   * @internal
   */
  public position: Vector3;

  private _enabledTranslation: [boolean, boolean, boolean] = [true, true, true];

  private _enabledRotation: [boolean, boolean, boolean] = [true, true, true];

  /**
   * @internal
   */
  constructor(private engine: PhysicsRapierWrapper) {
    this.id = this.engine.colliders.ids++;
  }

  /**
   * Returns the component this collider is attached to
   */
  get component(): Component3D {
    return this.mesh;
  }

  get isSensor() {
    return this._isSensor;
  }

  /**
   * @internal
   */
  get = (colliderInfo: CollisionInfo) => {
    if (colliderInfo.mesh.data.id === "model_rMolTYj76iWAOTA1ntUYc") debugger;

    this.rigidbodyType = colliderInfo.rigidbodyType;

    this.colliderType = colliderInfo.colliderType;

    this.vertices = colliderInfo.vertices;

    this.indices = colliderInfo.indices;

    this.position = colliderInfo.position;

    this.quaternion = colliderInfo.quaternion;

    this.dimensions = colliderInfo.dimensions;

    this.scale = colliderInfo.scale;

    this.mesh = colliderInfo.mesh;

    this.name = this.mesh.name;

    this.groups = colliderInfo.groups || [GROUPS.COLLIDERS];

    this.colliderDesc = this.createColliderDesc(colliderInfo);

    this.rigidBody = this.createBody(colliderInfo);

    if (colliderInfo.enabledTranslation) {
      this.enabledTranslation = colliderInfo.enabledTranslation;
    }

    if (colliderInfo.enabledRotation) {
      this.enabledRotation = colliderInfo.enabledRotation;
    }

    this.rigidBody.userData = {
      name: this.name,
      id: this.id,
      rigidbodyType: this.rigidbodyType,
      colliderType: this.colliderType,
      mesh: this.mesh,
      parent: this,
    };

    const collider = this.engine.world.createCollider(
      this.colliderDesc,
      this.rigidBody
    );

    this._collider = collider;

    this._collider.name = this.name;

    return this;
  };

  private createColliderDesc(colliderOpts) {
    let colliderDesc;

    switch (this.colliderType) {
      case COLLIDER_TYPES.MESH:
        if (this.indices != null) {
          let i = 0;

          while (i < this.vertices.length) {
            this.vertices[i] *= this.scale.x;

            this.vertices[i + 1] *= this.scale.y;

            this.vertices[i + 2] *= this.scale.z;

            i += 3;
          }

          colliderDesc = this.engine.RAPIER.ColliderDesc.trimesh(
            this.vertices,
            this.indices
          );
        } else {
          colliderDesc = this.engine.RAPIER.ColliderDesc.convexHull(
            this.vertices
          );
        }

        break;

      case COLLIDER_TYPES.CUBE:
        colliderDesc = this.engine.RAPIER.ColliderDesc.cuboid(
          this.dimensions.width * 0.5,
          this.dimensions.height * 0.5,
          this.dimensions.depth * 0.5
        );

        colliderDesc.setTranslation(
          this.dimensions.center.x,
          this.dimensions.center.y,
          this.dimensions.center.z
        );

        break;

      case COLLIDER_TYPES.SPHERE:
        colliderDesc = this.engine.RAPIER.ColliderDesc.ball(
          this.dimensions.radius
        );

        colliderDesc.setTranslation(
          this.dimensions.center.x,
          this.dimensions.center.y,
          this.dimensions.center.z
        );

        break;

      case COLLIDER_TYPES.CAPSULE:
        colliderDesc = this.engine.RAPIER.ColliderDesc.capsule(
          this.dimensions.height * 0.5 - this.dimensions.radius,

          this.dimensions.radius
        );

        colliderDesc.setTranslation(0, this.dimensions.height * 0.5, 0);

        break;

      case COLLIDER_TYPES.CYLINDER:
        colliderDesc = this.engine.RAPIER.ColliderDesc.cylinder(
          this.dimensions.height * 0.5,

          this.dimensions.radius
        );

        colliderDesc.setTranslation(
          this.dimensions.center?.x ?? 0,
          this.dimensions.center?.y ?? 0,
          this.dimensions.center?.z ?? 0
        );

        break;
    }

    if (colliderOpts.isSensor) {
      this._isSensor = true;
      colliderDesc.setSensor(true);
    }

    if (colliderOpts.restitution) {
      colliderDesc.setRestitution(colliderOpts.restitution);
    }

    if (colliderOpts.friction) {
      colliderDesc.setFriction(colliderOpts.friction);
    }

    if (colliderOpts.density) {
      colliderDesc.setDensity(colliderOpts.density);
    }

    if (colliderOpts.mass) {
      colliderDesc.setMass(colliderOpts.mass);
    }

    if (this.groups) {
      const layer = new Layers();

      layer.addGroup(this.groups);

      colliderDesc.setCollisionGroups(layer.generate(this.groups));
    }

    return colliderDesc;
  }

  /**
   * @internal
   */
  setGroups(membership: number[], filter: number[]) {
    this.groups = membership;

    if (this._collider) {
      const layer = new Layers();

      layer.addGroup(this.groups);

      this._collider.setCollisionGroups(layer.generate(filter));
    }
  }

  private createBody(colliderInfo) {
    let rigibody;

    switch (this.rigidbodyType) {
      case RIGIDBODY_TYPES.KINEMATIC:
      case RIGIDBODY_TYPES.PLAYER:
        rigibody = this.engine.RAPIER.RigidBodyDesc.kinematicPositionBased();

        rigibody.setCcdEnabled(true); // continuous collision detection

        break;
      case RIGIDBODY_TYPES.DYNAMIC_PLAYER:
        rigibody = this.engine.RAPIER.RigidBodyDesc.dynamic();

        rigibody.setCcdEnabled(true);

        rigibody.setSleeping(false);

        // rigibody.setCanSleep(false)

        break;

      case RIGIDBODY_TYPES.DYNAMIC:
        rigibody = this.engine.RAPIER.RigidBodyDesc.dynamic();

        rigibody.setCanSleep(false); // sleeping rigidbodies are not updated by the physics engine

        rigibody.setSleeping(false);

        // rigibody.setEnabled(false)
        rigibody.setCcdEnabled(true);

        // debugger;

        // rigibody.lockTranslations()

        // rigibody.lockRotations()

        break;

      case RIGIDBODY_TYPES.FIXED:
        rigibody = this.engine.RAPIER.RigidBodyDesc.fixed();

        break;

      default:
        console.warn("no rigidbody type");
    }

    if (this.position) {
      rigibody.setTranslation(
        this.position.x,

        this.position.y,

        this.position.z
      );
    }

    if (this.quaternion) {
      rigibody.setRotation(this.quaternion);
    }

    if (this.enabledRotation) {
    }

    const rigidBodyDesc = this.engine.world.createRigidBody(rigibody);

    return rigidBodyDesc;
  }

  /**
   * Use this to lock the rigidbody's translation on a specific axis
   * cf {@link https://rapier.rs/docs/user_guides/javascript/rigid_bodies/#locking-translationsrotations | Rapier docs } for more info
   *
   * @param axis - axis to lock [x, y, z]
   */
  set enabledTranslation(enabledTranslation: [boolean, boolean, boolean]) {
    // @ts-ignore
    this.rigidBody.lockTranslations();

    this.rigidBody.setEnabledTranslations(
      enabledTranslation[0],

      enabledTranslation[1],

      enabledTranslation[2],

      true
    );

    this._enabledTranslation = enabledTranslation;
  }

  /**
   * Returns the current translation lock state
   */
  get enabledTranslation() {
    return this._enabledTranslation;
  }

  /**
   * Use this to lock the rigidbody's rotation on a specific axis
   * cf {@link https://rapier.rs/docs/user_guides/javascript/rigid_bodies/#locking-translationsrotations | Rapier docs } for more info
   *
   * @param axis - axis to lock [x, y, z]
   */
  set enabledRotation(enabledRotation: [boolean, boolean, boolean]) {
    // @ts-ignore
    this.rigidBody.lockRotations();

    this.rigidBody.setEnabledRotations(
      enabledRotation[0],

      enabledRotation[1],

      enabledRotation[2],

      true
    );

    this._enabledRotation = enabledRotation;
  }

  /**
   * Returns the current rotation lock state
   */
  get enabledRotation() {
    return this._enabledRotation;
  }

  /**
   * Returns the enabled state of the rigidbody
   */
  get enabled() {
    return this._enabled;

    return this.rigidBody.isEnabled();
  }

  /**
   * Use this to enable/disable the rigidbody
   */
  set enabled(enabled: boolean) {
    this._enabled = enabled;

    this.rigidBody.setEnabled(enabled);
  }

  /**
   * @internal
   */
  dispose() {
    //
    this.enabled = false;
    // removing a rigidbody also removes its colliders and joints
    // this.engine.world.removeCollider(this._collider, true);

    const idx = this.engine.colliders.collidersArray.indexOf(this.mesh);

    if (idx > -1) {
      this.engine.colliders.collidersArray.splice(idx, 1);
    } else {
      console.error("collider not found in collidersArray", this.mesh);
    }

    this.engine.world.removeRigidBody(this.rigidBody);
  }

  /**
   * @internal
   */
  _activeEvents = {
    collision: false,
    sensor: false,
    any: false,
  };

  /**
   * @internal
   */
  __updateActiveEvents() {
    //

    this._activeEvents.collision = this._hasCollisionEvents();

    this._activeEvents.sensor = this._hasSensorEvents();

    this._activeEvents.any =
      this._activeEvents.collision || this._activeEvents.sensor;

    const mask = this._activeEvents.any
      ? this.engine.RAPIER.ActiveEvents.COLLISION_EVENTS
      : (0 as any);

    this._collider.setActiveEvents(mask);
  }

  /**
   * @internal
   */
  private _hasCollisionEvents() {
    //
    return (
      this.mesh.hasListeners(this.mesh.EVENTS.COLLISION_ENTER) ||
      this.mesh.hasListeners(this.mesh.EVENTS.COLLISION_STAY) ||
      this.mesh.hasListeners(this.mesh.EVENTS.COLLISION_EXIT)
    );
  }

  /**
   * @internal
   */
  private _hasSensorEvents() {
    //
    return (
      this.mesh.hasListeners(this.mesh.EVENTS.SENSOR_ENTER) ||
      this.mesh.hasListeners(this.mesh.EVENTS.SENSOR_STAY) ||
      this.mesh.hasListeners(this.mesh.EVENTS.SENSOR_EXIT)
    );
  }

  private _fsms: Map<Collider, CollisionFSM> = new Map();

  /**
   * @internal
   */
  _onCollisionChange(
    collider: Collider,
    collision: BaseIntersectionEvent | null
  ) {
    //

    // console.log(
    //     "COLLISION CHANGE",
    //     this.engine.frame,
    //     this.mesh,
    //     collider.mesh,
    //     collision,
    // );

    let fsm = this._fsms.get(collider);

    if (!fsm) {
      //
      fsm = new CollisionFSM();

      this._fsms.set(collider, fsm);
    }

    fsm.currentCollision = collision;
  }

  /**
   * @internal
   */
  _onEmitCollision(frame: number) {
    //
    if (!this._activeEvents.any) {
      return;
    }

    this._fsms.forEach((fsm, other) => {
      //
      // For currently intersecting colliders, we read the intersection graph to check
      // if they're still intersecting.

      const isSensor = this._isSensor || other._isSensor;

      const isOngoing =
        fsm.state.type === fsm.STATES.Stay ||
        fsm.state.type === fsm.STATES.Enter;

      if (
        isSensor &&
        isOngoing &&
        this.rigidbodyType !== RIGIDBODY_TYPES.KINEMATIC &&
        this.rigidbodyType !== RIGIDBODY_TYPES.PLAYER &&
        other.rigidbodyType !== RIGIDBODY_TYPES.KINEMATIC &&
        other.rigidbodyType !== RIGIDBODY_TYPES.PLAYER
      ) {
        //

        let intersecting = this.engine.world.intersectionPair(
          this._collider,
          other._collider
        );

        // console.log("checking ongoing intersection", intersecting);

        if (!intersecting) {
          fsm.currentCollision = null;
        } else {
          fsm.currentCollision = fsm.state.collision;
        }
      }

      let state = fsm.update(frame);

      if (state.type === fsm.STATES.Enter) {
        //
        if (isSensor) {
          this._onSensorEnterEvent(state.collision as any);
        } else {
          this._onCollisionEnterEvent(state.collision as any);
        }
        //
      } else if (state.type === fsm.STATES.Exit) {
        //
        const event = {
          me: state.collision.me,
          other: state.collision.other,
          frame,
        };

        if (isSensor) {
          this._onSensorExitEvent(event);
        } else {
          this._onCollisionExitEvent(event);
        }
      } else if (state.type === fsm.STATES.Stay) {
        //
        if (isSensor) {
          this._onSensorStayEvent(state.collision as any);
        } else {
          this._onCollisionStayEvent(state.collision as any);
        }
        //
      } else if (state.type === fsm.STATES.Idle) {
        //
        // console.log("IDLE", collision.me, collision.other);
        this._fsms.delete(other);
      }
    });
  }

  /**
   * @internal
   */
  private _onCollisionEnterEvent(payload: CollisionEnterEvent) {
    //
    if (!this.mesh.hasListeners(this.mesh.EVENTS.COLLISION_ENTER)) {
      return;
    }

    // console.log(
    //     "COLLISION ENTER",
    //     payload.frame,
    //     this.mesh,
    //     payload.other,
    //     payload,
    // );

    /*
        const contactPoints = payload.contactPoints;

        
        if (contactPoints?.length === 0) {
            debugger;
        }

        
        if (
            contactPoints?.length > 0 &&
            this.rigidbodyType !== RIGIDBODY_TYPES.KINEMATIC &&
            this.rigidbodyType !== RIGIDBODY_TYPES.PLAYER &&
            payload.other.collider.rigidbodyType !==
                RIGIDBODY_TYPES.KINEMATIC &&
            payload.other.collider.rigidbodyType !== RIGIDBODY_TYPES.PLAYER
        ) {
            this.__drawDebugRays(this.mesh, payload.contactPoints);
        }
        */

    this.mesh.emit(this.mesh.EVENTS.COLLISION_ENTER, payload);
  }

  /**
   * @internal
   */
  private _onCollisionExitEvent(payload: CollisionExitEvent) {
    //
    if (!this.mesh.hasListeners(this.mesh.EVENTS.COLLISION_EXIT)) {
      return;
    }

    // console.log(
    //     "COLLISION EXIT",
    //     payload.frame,
    //     this.mesh,
    //     payload.other,
    //     payload,
    // );

    this.mesh.emit(this.mesh.EVENTS.COLLISION_EXIT, payload);
  }

  /**
   * @internal
   */
  private _onCollisionStayEvent(payload: BaseIntersectionEvent) {
    //
    if (!this.mesh.hasListeners(this.mesh.EVENTS.COLLISION_STAY)) {
      return;
    }

    // console.log(
    //     "COLLISION STAY",
    //     payload.frame,
    //     this.mesh,
    //     payload.other,
    //     payload,
    // );

    this.mesh.emit(this.mesh.EVENTS.COLLISION_STAY, payload);
  }

  private _onSensorEnterEvent(payload: CollisionEnterEvent) {
    //
    if (!this.mesh.hasListeners(this.mesh.EVENTS.SENSOR_ENTER)) {
      return;
    }

    // console.log(
    //     "SENSOR ENTER",
    //     payload.frame,
    //     this.mesh,
    //     payload.other,
    //     payload,
    // );

    this.mesh.emit(this.mesh.EVENTS.SENSOR_ENTER, payload);
  }

  private _onSensorExitEvent(payload: CollisionExitEvent) {
    //
    if (!this.mesh.hasListeners(this.mesh.EVENTS.SENSOR_EXIT)) {
      return;
    }

    // console.log(
    //     "SENSOR EXIT",
    //     payload.frame,
    //     this.mesh,
    //     payload.other,
    //     payload,
    // );

    this.mesh.emit(this.mesh.EVENTS.SENSOR_EXIT, payload);
  }

  private _onSensorStayEvent(payload: BaseIntersectionEvent) {
    //
    if (!this.mesh.hasListeners(this.mesh.EVENTS.SENSOR_STAY)) {
      return;
    }

    // console.log(
    //     "SENSOR STAY",
    //     payload.frame,
    //     this.mesh,
    //     payload.other,
    //     payload,
    // );

    this.mesh.emit(this.mesh.EVENTS.SENSOR_STAY, payload);
  }

  /*
    _debugRays: ArrowHelper[] = [];

    _tmpVec = new Vector3();

    __drawDebugRays(mesh, points: ContactPoint[]) {
        //
        // this._debugRays?.forEach((ray) => {
        //     ray.parent.remove(ray);
        //     ray.dispose();
        // });

        // this._debugRays = [];

        points.forEach((point) => {
            // compute unique hex color from mesh id

            const hex = (
                (mesh.id * 0x1000000 + Math.random() * 0xffffff) <<
                0
            ).toString(16);

            let rayHelper = new ArrowHelper(
                new Vector3(0, 0, 0),
                new Vector3(0, 0, 0),
                1,
                parseInt(hex, 16),
            );

            rayHelper.name = "debugRay";

            // rayHelper.line.material.depthTest = false;

            // rayHelper.line.material.depthWrite = false;

            // rayHelper.cone.material.depthTest = false;

            // rayHelper.cone.material.depthWrite = false;

            rayHelper.setLength(10, 0.1, 0.1);

            mesh.parent.add(rayHelper);

            rayHelper.position.set(
                point.position.x,
                point.position.y,
                point.position.z,
            );

            rayHelper.setDirection(
                this._tmpVec.set(
                    point.normal.x,
                    point.normal.y,
                    point.normal.z,
                ),
            );

            this._debugRays.push(rayHelper);
        });
    }
    */
}
