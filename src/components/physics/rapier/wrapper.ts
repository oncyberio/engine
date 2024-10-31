import {
  BufferAttribute,
  BufferGeometry,
  Clock,
  DynamicDrawUsage,
  LineBasicMaterial,
  LineSegments,
  Object3D,
} from "three";

import Emitter from "engine/events/emitter";

import Events from "engine/events/events";

import { getRapier } from "./utils/getRapier";

import { GROUPS, RIGIDBODY_TYPES } from "./constants";

import Scene from "engine/scene";

import type {
  World,
  EventQueue,
  NarrowPhase,
  Collider as RCollider,
  QueryFilterFlags,
} from "@dimforge/rapier3d";
import type RAPIER from "@dimforge/rapier3d";
import { ManifoldCollisionEvent } from "./manifoldcollisionevent";
import { IntersectionEvent } from "./intersectionevent";
import { PhysicsOpts } from "../types";
import { RigidBodyWrapper } from "./rigidbody";
import { Collider } from "./rigidbody/collider";

const PHYSICS_WORLD_PARAMS = {
  gravity: {
    x: 0.0,

    y: -9.81,

    z: 0.0,
  },
};

/**
 * @public
 *
 * Wrapper for the physics engine, currently using Rapier3D
 *
 * This is the type of the {@link Physics} variable in the scripting API
 */
export default class PhysicsRapierWrapper extends Object3D {
  /**
   * @internal
   */
  public opts = null;

  /**
   * @internal
   */
  public RAPIER: typeof RAPIER = null;

  /**
   * @internal
   */
  public ray = null;

  /**
   * Current Rapier world instance; cf {@link https://rapier.rs/javascript3d/classes/World.html | Rapier docs} for more info
   */
  public world: World = null;

  public eventQueue: EventQueue = null;

  public narrowPhase: NarrowPhase = null;

  private _init = false;

  private _fixedTimeStep = 1 / 60;

  /**
   * @internal
   */
  public debugLines = null;

  /**
   * @internal
   */
  public clock = new Clock();

  private _active = false;

  private _rigidBodies: RigidBodyWrapper[] = [];

  private debugPositionAttr: BufferAttribute;
  private debugColorAttr: BufferAttribute;

  private nextDebugPositions: Float32Array;
  private nextDebugColors: Float32Array;

  /**
   * @internal
   */
  constructor(
    opts: {
      debug: boolean;
    } = null
  ) {
    super();

    this.name = "PHYSICS-RAPIER";

    this.active = false;

    this.opts = opts;

    //this.active = true;

    // this.colliders = new Colliders(this);

    if (opts.debug) {
      this.initDebug();
    }
  }

  /**
   * @internal
   */
  initDebug() {
    let material = new LineBasicMaterial({
      color: 0x00ff00,

      vertexColors: true,
    });

    let geometry = new BufferGeometry();

    this.debugLines = new LineSegments(geometry, material);

    this.debugLines.frustumCulled = false;

    Scene.add(this.debugLines);

    // console.log( this.)
  }

  /**
   * @internal
   */
  updateDebug = () => {
    //
    const buffers = this.world.debugRender();

    this.nextDebugPositions = buffers.vertices;
    this.nextDebugColors = buffers.colors;

    this.debugLines.geometry.setAttribute(
      "position",
      new BufferAttribute(buffers.vertices, 3)
    );

    this.debugLines.geometry.setAttribute(
      "color",
      new BufferAttribute(buffers.colors, 4)
    );
  };

  /**
   * @internal
   */
  async init() {
    if (this._init)
      return console.warn("PhysicsRapierWrapper already initialized");

    this.RAPIER = await getRapier();

    this.ray = new this.RAPIER.Ray(
      new this.RAPIER.Vector3(0, 0, 0),

      new this.RAPIER.Vector3(0, -1, 0)
    );

    this.world = new this.RAPIER.World(PHYSICS_WORLD_PARAMS.gravity);

    this.eventQueue = new this.RAPIER.EventQueue(true);

    this._init = true;
  }

  /**
   * @internal
   */
  createRigidBody(opts: PhysicsOpts) {
    //
    const bodyWrapper = new RigidBodyWrapper(
      this,
      opts.component,
      opts.rigitBodyOpts
    );

    this._rigidBodies.push(bodyWrapper);

    return bodyWrapper;
  }

  /**
   * @internal
   */
  removeRigidBody(body: RigidBodyWrapper) {
    //
    body.dispose();

    const index = this._rigidBodies.indexOf(body);

    if (index === -1) return;

    this._rigidBodies.splice(index, 1);
  }

  private __frame = 0;

  get frame() {
    //
    return this.__frame;
  }

  private _syncFromTransform() {
    //
    Scene.updateMatrixWorld();

    for (let i = 0, l = this._rigidBodies.length; i < l; i++) {
      //
      const body = this._rigidBodies[i];

      if (!body._autoSyncTransform) continue;

      body._syncFromTransform();
    }
  }

  private _syncToTransform() {
    //
    for (let i = 0, l = this._rigidBodies.length; i < l; i++) {
      //
      const body = this._rigidBodies[i];

      if (body.options.type !== RIGIDBODY_TYPES.DYNAMIC) continue;

      body._syncFromPhysics();
    }
  }

  private _preInterpolate() {
    //
    for (let i = 0, l = this._rigidBodies.length; i < l; i++) {
      //
      const body = this._rigidBodies[i];

      if (!body._interpolate) continue;

      body._preInterpolate();
    }
  }

  private _interpolate(alpha: number) {
    //
    for (let i = 0, l = this._rigidBodies.length; i < l; i++) {
      //
      const body = this._rigidBodies[i];

      if (!body._interpolate) continue;

      body._interpolatePose(alpha);
    }
  }

  /**
   * @internal
   */

  private processCollisionEvent(
    source1: RCollider,
    source2: RCollider,
    started: boolean
  ) {
    const collider1 = Collider.getFromRaw(source1);
    const collider2 = Collider.getFromRaw(source2);

    if (!collider1 || !collider2) {
      //
      return;
    }

    // console.log("COLLISION STARTED", collider1, collider2);

    //
    const isSensor = source1.isSensor() || source2.isSensor();

    /**
     * The event queue reports when a sensor intersects with another collider
     * But reports an exit event immediately on the next frame
     *
     * We'll ignore the exit notification, and instead check if the sensor is still intersecting
     * with the other collider on subsequent frames
     */
    if (isSensor) {
      //
      if (!started) return;

      collider1._onCollisionChange(
        collider2,
        new IntersectionEvent(
          collider1.component,
          collider2.component,
          this.__frame
        )
      );

      //
      collider2._onCollisionChange(
        collider1,
        new IntersectionEvent(
          collider2.component,
          collider1.component,
          this.__frame
        )
      );

      return;
    }

    collider1._onCollisionChange(
      collider2,
      started
        ? new ManifoldCollisionEvent(
            this,
            collider1.component,
            collider2.component,
            this.__frame
          )
        : null
    );

    //
    collider2._onCollisionChange(
      collider1,
      started
        ? new ManifoldCollisionEvent(
            this,
            collider2.component,
            collider1.component,
            this.__frame
          )
        : null
    );
  }

  /**
   * @internal
   */
  updateFixed = (deltaTime) => {
    //
    if (deltaTime > 0.1) deltaTime = 0.1;

    if (!this.active) return;

    this.__frame++;

    this.world.timestep = deltaTime;

    this._syncFromTransform();

    this.world.step(this.eventQueue);

    this._syncToTransform();

    this.eventQueue.drainCollisionEvents((handle1, handle2, started) => {
      //
      const source1 = this.world.getCollider(handle1);

      const source2 = this.world.getCollider(handle2);

      this.processCollisionEvent(source1, source2, started);
    });

    for (let i = 0, l = this._rigidBodies.length; i < l; i++) {
      //
      const body = this._rigidBodies[i];

      for (let j = 0; j < body.colliders.length; j++) {
        //
        const collider = body.colliders[j];

        if (collider._activeEvents.any) {
          //
          collider._onEmitCollision(this.__frame);
        }
      }
    }

    // this.engine.world.contactsWith(player.collider, (otherCollider) => {

    //     console.log("CONTACTS WITH", otherCollider.parent().userData)

    //     this.colliders.colliders.get(0).emitter.emit("COLLIDE", {

    //         collider: this.colliders.colliders.get(otherCollider.userData.id),

    //         data: otherCollider.parent().userData
    //     });

    // });
  };

  private _accumulatedTime = 0;

  update = (dt: number, time: number) => {
    //
    if (!this.world || !this.active) return;

    if (__BUILD_TARGET__ == "web") {
      //
      dt = Math.min(dt, 0.1);
    }

    this._accumulatedTime += dt;

    // const isMoving = true;

    // isMoving &&
    //     console.group(
    //         "PHYSICS UPDATE",
    //         dt.toFixed(4),
    //         this._accumulatedTime.toFixed(4)
    //     );

    let now = time;

    while (this._accumulatedTime >= this._fixedTimeStep) {
      //

      this._preInterpolate();

      Emitter.emit(Events.FIXED_UPDATE, this._fixedTimeStep, now);

      // isMoving &&
      //     console.log("FIXED UPDATE", this._fixedTimeStep.toFixed(4));

      this.updateFixed(this._fixedTimeStep);

      Emitter.emit(Events.AFTER_FIXED_UPDATE, this._fixedTimeStep, now);

      this._accumulatedTime -= this._fixedTimeStep;

      now += this._fixedTimeStep;
    }

    //isMoving && console.groupEnd();

    const alpha = this._accumulatedTime / this._fixedTimeStep;

    this._interpolate(alpha);

    Emitter.emit(Events.FIXED_INTERPOLATE, alpha);

    if (this.opts.debug) {
      this.updateDebug();
    }
  };

  /**
   * Performs a raycast in the physics world and returns information about the hit, if any.
   * @param ray - The ray to cast.
   * @returns An object containing information about the hit, or `null` if no hit occurred.
   */
  // @ts-ignore
  raycast = (ray: {
    origin: { x: number; y: number; z: number };
    direction: { x: number; y: number; z: number };
    maxDistance?: number;
    ignoreRigidbody?: any;
    filterFlags?: QueryFilterFlags;
    shouldRaycast?: (collider: RCollider) => boolean;
  }) => {
    this.ray.origin.x = ray.origin.x;

    this.ray.origin.y = ray.origin.y;

    this.ray.origin.z = ray.origin.z;

    this.ray.dir.x = ray.direction.x;

    this.ray.dir.y = ray.direction.y;

    this.ray.dir.z = ray.direction.z;

    let maxToi = ray.maxDistance || 50.0;

    let solid = true;

    let hit = this.world.castRay(
      this.ray,

      maxToi,

      solid,

      ray.filterFlags || null,

      // this.world.colliders.layers.generate([GROUPS.COLLIDERS]),

      null,

      ray.ignoreRigidbody || null,

      null,

      (handle) => {
        if (ray.shouldRaycast) return ray.shouldRaycast(handle);

        return true;
      }
    );

    if (hit) {
      // @ts-ignore
      // if (hit.collider?.parent().userData?.rigidbodyType === "KINEMATIC") return null;

      let hitPoint = this.ray.pointAt(hit.toi); // Same as: `ray.origin + ray.dir * toi`

      return {
        point: {
          x: hitPoint.x,

          y: hitPoint.y,

          z: hitPoint.z,
        },

        distance: hit.toi,

        triangle: {
          // @ts-ignore
          meshName: hit.collider?.name,
        },

        raw: hit,

        hit: hit.collider?.parent().userData,
      };
    }

    // console.log("raycast took", performance.now() - start, "ms");
    return null;
  };

  /**
   * activate or deactivate the physics engine
   */
  set active(value: boolean) {
    this._active = value;

    if (value) {
      this.addEvents();
    } else {
      this.removeEvents();
    }
  }

  /**
   * Returns true if the physics engine is active
   */
  get active() {
    return this._active;
  }

  /**
   * @internal
   */
  addEvents() {
    Emitter.on(Events.PHYSICS_UPDATE, this.update);
  }

  /**
   * @internal
   */
  removeEvents() {
    Emitter.off(Events.PHYSICS_UPDATE, this.update);
  }

  /**
   * @internal
   */
  dispose() {
    console.log("DISPOSE PHYSICS YOLO");

    this.removeEvents();

    this._init = false;

    this.RAPIER = null;

    this.ray = null;

    if (this.world != null) {
      this.world.free();
    }

    this.world = null;

    if (this.opts.debug) {
      Scene.remove(this.debugLines);

      this.debugLines.geometry.dispose();
    }
  }
}
