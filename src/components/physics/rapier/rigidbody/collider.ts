import type PhysicsRapierWrapper from "../wrapper";
import {
  COLLIDER_TYPES,
  RIGIDBODY_TYPES,
} from "engine/components/physics/constants";
import {
  BaseIntersectionEvent,
  ColliderOpts,
  CollisionEnterEvent,
  CollisionExitEvent,
} from "engine/components/physics/types";
import type {
  ColliderDesc,
  Collider as RapierCollider,
} from "@dimforge/rapier3d";
import { Component3D } from "engine/abstract/component3D";
import { RigidBodyWrapper } from ".";
import { CollisionFSM } from "./collisionFSM";

/**
 * @public
 *
 * This class represents a Collider added to a rigid body of a component.
 *
 * it offers a convenient wrapper around the collider of the underlying physics engine.
 *
 * For more info on the underlying physics engine, cf {@link https://rapier.rs/docs/ | Rapier docs }
 */
export class Collider {
  //

  private static _rawCollidersMap = new WeakMap<RapierCollider, Collider>();

  static getFromRaw(raw: RapierCollider) {
    //
    return this._rawCollidersMap.get(raw);
  }

  private _rawColliderDesc: ColliderDesc;

  private _rawCollider: RapierCollider;

  private _options: ColliderOpts;

  private _enabled = true;

  constructor(
    private engine: PhysicsRapierWrapper,
    _colliderOpts: ColliderOpts,
    private _parent: RigidBodyWrapper
  ) {
    //
    this._options = structuredClone(_colliderOpts);

    this._createCollider();
  }

  private _createCollider() {
    //
    let colliderDesc: ColliderDesc;

    const opts = this._options;

    switch (opts.type) {
      //
      case COLLIDER_TYPES.MESH:
        //
        colliderDesc = this.engine.RAPIER.ColliderDesc.trimesh(
          opts.vertices,
          opts.indices
        );

        break;

      case COLLIDER_TYPES.CUBE:
        //
        colliderDesc = this.engine.RAPIER.ColliderDesc.cuboid(
          opts.width * 0.5,
          opts.height * 0.5,
          opts.depth * 0.5
        );

        break;

      case COLLIDER_TYPES.SPHERE:
        //
        colliderDesc = this.engine.RAPIER.ColliderDesc.ball(opts.radius);

        break;

      case COLLIDER_TYPES.CAPSULE:
        //
        colliderDesc = this.engine.RAPIER.ColliderDesc.capsule(
          opts.height * 0.5,
          opts.radius
        );

        break;

      case COLLIDER_TYPES.CYLINDER:
        //
        colliderDesc = this.engine.RAPIER.ColliderDesc.cylinder(
          opts.height * 0.5,
          opts.radius
        );

        break;
    }

    if (opts.position) {
      //
      const { x, y, z } = opts.position;
      colliderDesc.setTranslation(x, y, z);
    }

    if (opts.isSensor != null) {
      this.isSensor = opts.isSensor;
      colliderDesc.setSensor(opts.isSensor);
    }

    if (opts.restitution != null) {
      colliderDesc.setRestitution(opts.restitution);
    }

    if (opts.friction != null) {
      colliderDesc.setFriction(opts.friction);
    }

    // rn, setting density will override mass, issue is we're not sure
    // if the current value was set by the user or just the default one
    // if (opts.density != null) {
    //     colliderDesc.setDensity(opts.density);
    // }

    if (opts.mass != null) {
      colliderDesc.setMass(opts.mass);
    }

    if (opts.groups) {
      colliderDesc.setCollisionGroups(opts.groups);
    }

    opts.groups = opts.groups;

    this._rawColliderDesc = colliderDesc;

    this._rawCollider = this.engine.world.createCollider(
      colliderDesc,
      this._parent.raw
    );

    Collider._rawCollidersMap.set(this._rawCollider, this);
  }

  // samsy
  // for avatars
  _updateCollider(dimensions) {
    const opts = this._options;

    switch (opts.type) {
      case COLLIDER_TYPES.CAPSULE:
        let val = {
          height: dimensions.y - dimensions.x * 0.5 * 2,
          radius: dimensions.x * 0.5,
        };

        this._rawCollider.setHalfHeight(val.height * 0.5);

        this._rawCollider.setRadius(val.radius);

        this._rawCollider.setTranslationWrtParent({
          x: 0,
          y: val.height * 0.5 + val.radius,
          z: 0,
        });

        break;

      case COLLIDER_TYPES.CUBE:
        this._rawCollider.setHalfExtents({
          x: dimensions.x * 0.5,
          y: dimensions.y * 0.5,
          z: dimensions.z * 0.5,
        });

        this._rawCollider.setTranslationWrtParent({
          x: 0,
          y: dimensions.y * 0.5,
          z: 0,
        });

        break;
    }
  }

  private _validateGroups(groups: number[]) {
    if (groups.some((g) => g < 0 || g > 15 || !Number.isInteger(g))) {
      throw new Error("Group numbers must be integers between 0 and 15");
    }
  }
  /**
   * @internal
   */
  setGroups(membership: number[], filter: number[]) {
    // Ensure that both membership and filter arrays contain valid group numbers (0-15)

    this._validateGroups(membership);
    this._validateGroups(filter);

    // Calculate the membership bitmask
    const membershipBitmask = membership.reduce(
      (mask, group) => mask | (1 << group),
      0
    );

    // Calculate the filter bitmask
    const filterBitmask = filter.reduce(
      (mask, group) => mask | (1 << group),
      0
    );

    // Combine the bitmasks into a single 32-bit value
    const mask = (membershipBitmask << 16) | filterBitmask;

    // Set the collision groups
    this._rawCollider.setCollisionGroups(mask);
  }

  /**
   * Returns the rigid body this collider is attached to
   */
  get parent() {
    return this._parent;
  }

  /**
   * Returns the component this collider belongs to
   */
  get component(): Component3D {
    return this._parent.component;
  }

  /**
   * Returns wether the collider is enabled or not
   */
  get enabled() {
    return this._enabled;
  }

  /**
   * enables or disables the collider
   */
  set enabled(enabled: boolean) {
    this._enabled = enabled;
    this._rawCollider.setEnabled(enabled);
  }

  get raw() {
    return this._rawCollider;
  }

  /**
   * Returns options used to create this collider
   */
  get options() {
    return this._options;
  }

  /**
   * Returns the mass of this collider
   */
  get mass() {
    return this._options.mass;
  }

  /**
   * Sets the mass of this collider
   */
  set mass(mass: number) {
    this._options.mass = mass;
    this._rawCollider?.setMass(mass);
  }

  /**
   * Returns the friction coefficient of this collider
   */
  get friction() {
    return this._options.friction;
  }

  /**
   * Sets the friction coefficient of this collider
   */
  set friction(friction: number) {
    this._options.friction = friction;
    this._rawCollider?.setFriction(friction);
  }

  /**
   * Returns the restitution coefficient of this collider
   */
  get restitution() {
    return this._options.restitution;
  }

  /**
   * Sets the restitution coefficient of this collider
   */
  set restitution(restitution: number) {
    this._options.restitution = restitution;
    this._rawCollider?.setRestitution(restitution);
  }

  /**
   * Returns wether the collider is a sensor or not
   */
  get isSensor() {
    return this._options.isSensor;
  }

  /**
   * Sets this collider as a sensor or not
   */
  set isSensor(isSensor: boolean) {
    //
    this._options.isSensor = isSensor;

    this._rawCollider?.setSensor(isSensor);
  }

  private _wasDisposed = false;

  /**
   * @internal
   */
  dispose(wakeUpParent: boolean = true) {
    //
    if (this._wasDisposed) return;

    this._wasDisposed = true;

    if (this._rawCollider) {
      //
      Collider._rawCollidersMap.delete(this._rawCollider);

      this.engine.world.removeCollider(this._rawCollider, wakeUpParent);
    }
  }

  /*************************************************************************************************/
  /*************************************************************************************************/
  /*                              Internal API to support collision events                         */
  /*************************************************************************************************/
  /*************************************************************************************************/

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

    this.raw.setActiveEvents(mask);
  }

  /**
   * @internal
   */
  private _hasCollisionEvents() {
    //
    return (
      this.component.hasListeners(this.component.EVENTS.COLLISION_ENTER) ||
      this.component.hasListeners(this.component.EVENTS.COLLISION_STAY) ||
      this.component.hasListeners(this.component.EVENTS.COLLISION_EXIT)
    );
  }

  /**
   * @internal
   */
  private _hasSensorEvents() {
    //
    return (
      this.component.hasListeners(this.component.EVENTS.SENSOR_ENTER) ||
      this.component.hasListeners(this.component.EVENTS.SENSOR_STAY) ||
      this.component.hasListeners(this.component.EVENTS.SENSOR_EXIT)
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
    //     this.component,
    //     collider.component,
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

      const isSensor = this.isSensor || other.isSensor;

      const isOngoing =
        fsm.state.type === fsm.STATES.Stay ||
        fsm.state.type === fsm.STATES.Enter;

      if (
        isSensor &&
        isOngoing &&
        !this.parent.isKinematic &&
        !other.parent.isKinematic
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
    if (!this.component.hasListeners(this.component.EVENTS.COLLISION_ENTER)) {
      return;
    }

    // console.log(
    //     "COLLISION ENTER",
    //     payload.frame,
    //     this.component,
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
            this.__drawDebugRays(this.component, payload.contactPoints);
        }
        */

    this.component.emit(this.component.EVENTS.COLLISION_ENTER, payload);
  }

  /**
   * @internal
   */
  private _onCollisionExitEvent(payload: CollisionExitEvent) {
    //
    if (!this.component.hasListeners(this.component.EVENTS.COLLISION_EXIT)) {
      return;
    }

    // console.log(
    //     "COLLISION EXIT",
    //     payload.frame,
    //     this.component,
    //     payload.other,
    //     payload,
    // );

    this.component.emit(this.component.EVENTS.COLLISION_EXIT, payload);
  }

  /**
   * @internal
   */
  private _onCollisionStayEvent(payload: BaseIntersectionEvent) {
    //
    if (!this.component.hasListeners(this.component.EVENTS.COLLISION_STAY)) {
      return;
    }

    // console.log(
    //     "COLLISION STAY",
    //     payload.frame,
    //     this.component,
    //     payload.other,
    //     payload,
    // );

    this.component.emit(this.component.EVENTS.COLLISION_STAY, payload);
  }

  private _onSensorEnterEvent(payload: CollisionEnterEvent) {
    //
    if (!this.component.hasListeners(this.component.EVENTS.SENSOR_ENTER)) {
      return;
    }

    // console.log(
    //     "SENSOR ENTER",
    //     payload.frame,
    //     this.component,
    //     payload.other,
    //     payload,
    // );

    this.component.emit(this.component.EVENTS.SENSOR_ENTER, payload);
  }

  private _onSensorExitEvent(payload: CollisionExitEvent) {
    //
    if (!this.component.hasListeners(this.component.EVENTS.SENSOR_EXIT)) {
      return;
    }

    // console.log(
    //     "SENSOR EXIT",
    //     payload.frame,
    //     this.component,
    //     payload.other,
    //     payload,
    // );

    this.component.emit(this.component.EVENTS.SENSOR_EXIT, payload);
  }

  private _onSensorStayEvent(payload: BaseIntersectionEvent) {
    //
    if (!this.component.hasListeners(this.component.EVENTS.SENSOR_STAY)) {
      return;
    }

    // console.log(
    //     "SENSOR STAY",
    //     payload.frame,
    //     this.component,
    //     payload.other,
    //     payload,
    // );

    this.component.emit(this.component.EVENTS.SENSOR_STAY, payload);
  }

  /*
    _debugRays: ArrowHelper[] = [];

    _tmpVec = new Vector3();

    __drawDebugRays(component, points: ContactPoint[]) {
        //
        // this._debugRays?.forEach((ray) => {
        //     ray.parent.remove(ray);
        //     ray.dispose();
        // });

        // this._debugRays = [];

        points.forEach((point) => {
            // compute unique hex color from component id

            const hex = (
                (component.id * 0x1000000 + Math.random() * 0xffffff) <<
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

            component.parent.add(rayHelper);

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

  /*************************************************************************************************/
  /*************************************************************************************************/
  /*                              Compatibilty layer for the legacy collider api                   */
  /*************************************************************************************************/
  /*************************************************************************************************/

  /**
   * Rapier collider instance, cf {@link https://rapier.rs/docs/user_guides/javascript/colliders/ | Rapier docs } for more info
   */
  get _collider() {
    return this.raw;
  }

  /**
   * Collider type, cf {@link https://rapier.rs/docs/user_guides/javascript/colliders/ | Rapier docs } for more info on the meaning of different types
   */
  get colliderType() {
    //
    return this.options.type;
  }

  /**
   * Rigid body type, cf {@link https://rapier.rs/docs/user_guides/javascript/rigid_bodies/ | Rapier docs } for more info on the meaning of different types
   */
  get rigidbodyType() {
    //
    return this.parent.options.type;
  }

  /**
   * Collider description, cf {@link https://rapier.rs/docs/user_guides/javascript/colliders/ | Rapier docs } for more info
   */
  get colliderDesc() {
    //
    return this._rawColliderDesc;
  }

  /**
   * Rapier rigid body instance, cf {@link https://rapier.rs/docs/user_guides/javascript/rigid_bodies/ | Rapier docs } for more info
   */
  get rigidBody() {
    //
    return this.parent.raw;
  }

  /**
   * Use this to lock the rigidbody's translation on a specific axis
   * cf {@link https://rapier.rs/docs/user_guides/javascript/rigid_bodies/#locking-translationsrotations | Rapier docs } for more info
   */
  set enabledTranslation(enabledTranslation: [boolean, boolean, boolean]) {
    this.parent.rotationLock = enabledTranslation?.map((v) => !v) as any;
  }

  /**
   * Returns the current translation lock state
   */
  get enabledTranslation() {
    return this.parent.translationLock?.map((v) => !v) as any;
  }

  /**
   * Use this to lock the rigidbody's rotation on a specific axis
   * cf {@link https://rapier.rs/docs/user_guides/javascript/rigid_bodies/#locking-translationsrotations | Rapier docs } for more info
   */
  set enabledRotation(enabledRotation: [boolean, boolean, boolean]) {
    //
    this.parent.rotationLock = enabledRotation?.map((v) => !v) as any;
  }

  /**
   * Returns the current rotation lock state
   */
  get enabledRotation() {
    //
    return this.parent.rotationLock?.map((v) => !v) as any;
  }
}
