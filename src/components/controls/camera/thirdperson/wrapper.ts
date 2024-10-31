import { MathUtils, Matrix4, Ray, Vector2, Vector3, Spherical } from "three";
import { ControlsAbstract } from "../../abstract";
import { Controller } from "./controller";
import { IS_MOBILE, IS_TOUCH } from "engine/constants";
import { lerp } from "three/src/math/MathUtils.js";
import Clamp from "engine/utils/math/clamp";
import { Physics } from "engine/components/physics";
import Events from "engine/events/events.js";
import Emitter from "engine/events/emitter";
import type { World } from "@dimforge/rapier3d";
import Mix from "engine/utils/math/mix";
import PhysicsRapierWrapper from "engine/components/physics/rapier/wrapper";

const cartv3 = new Vector3();

const PLAYER_CAMERA_SENSITIVITY = 0.5;

const offset = new Vector3();

const twoPI = 2 * Math.PI;

const minPolarAngle = 0;
const maxPolarAngle = Math.PI * 0.8;

export interface ThirdPersonCameraControlsWrapperParams {
  /**
   * Represents the maximum distance from the target object
   */
  maxZoomOut?: number;

  /**
   * Represents the vertical offset from the target object
   */
  heightOffset?: number;

  /**
   * Represents the sensitivity of the camera
   */
  sensitivity?: {
    x?: number;
    y?: number;
  };

  /** Smoothing applied to the camera altitude. 0 = no smoothing, >0.2 = heavy smoothing */
  cameraAltitudeSmoothing: number;

  /** Distance at which the camera smoothing will be disabled to maintain said distance */
  cameraAltitudeMaxDistance: number;
}

/**
 * @public
 *
 * This class is used to implement third person camera mode.
 *
 * The controls use mouse movements to rotate the camera around the target object; By default the conttrols controller
 * will enter pointer lock mode when the user clicks on the canvas. To disable this behavior set the `usePointerLock`
 * property to false on the controls controller.
 *
 * The behavior of the controls can be customized by passing a {@link ThirdPersonCameraControlsWrapperParams}
 * object to the constructor
 *
 * The meaning of `object` & `target` options is intepreted as follows:
 *
 *   - The `object` is typically set to the camera object being controlled
 *
 *   - The `target` is the object that the camera will follow from the given maxZoomOut distance
 */
export class ThirdPersonCameraControlsWrapper extends ControlsAbstract {
  /**
   * The controller used to translate mouse movements into camera rotations
   */
  public controller: Controller = null;

  /**
   * @internal
   */
  public adjustCamera: boolean = false;

  /**
   * @internal
   */
  public radius: number = 0;

  /**
   * Represents the maximum distance from the target object
   */
  private _maxZoomOut: number = 5;

  /**
   * Represents the vertical offset from the target object
   */
  public heightOffset: number = 0;

  private quat: any;

  private spherical = new Spherical();

  private targetSpherical = new Spherical();

  private quatInverse: any;

  private idealCameraPosition = new Vector3();

  private idealCameraTarget = new Vector3();

  private cameraPosition = new Vector3();

  private cameraTarget = new Vector3();

  private cameraHeight: number = 0;

  private theta: number = 0;

  private phi: number = 0;

  private currentZoom: number = 0;

  public disableCollision = false;

  public disableWheelZoom = false;

  private _lerpByPos = false;

  private _lerpFactor = 0.2;

  /**
   * @internal
   */
  public sensitivity = new Vector2(
    PLAYER_CAMERA_SENSITIVITY,
    PLAYER_CAMERA_SENSITIVITY * 0.8
  );

  /**
   * Used to lock the camera movement on a specific axis
   */
  public lockAxis = {
    x: false,
    y: false,
  };

  cameraAltitudeMaxDistance = 25;

  cameraAltitudeSmoothing = 0.17;

  cameraVirtualTarget = new Vector3();

  private originVec = new Vector3();

  private rotationMatrix = new Matrix4();

  private origin = new Vector3(0, 0, 0);

  private playerCameraWorldDir = new Vector3();

  // public raycast = (ray) => ({ distance: 0 });

  /**
   * @internal
   */
  public ray = new Ray();

  private minRatioToRotateY = Math.tan(Math.PI / 6);

  private nearPlaneCorners: Vector3[] = [
    new Vector3(),
    new Vector3(),
    new Vector3(),
    new Vector3(),
  ];

  private world: World;

  private engine: PhysicsRapierWrapper;

  // private rapierRay = new RapierRay({x:0,y:0,z:0}, {x:0,y:0,z:0})

  private cameraDistance = new Vector3();

  private temp = {
    r: 0,
    theta: 0,
    phi: 0,
  };

  /**
   * @internal
   */
  constructor(opts) {
    super(opts);

    this.controller = new Controller(this);

    this.object.rotation.order = "YXZ";

    this.maxZoomOut = opts.params?.maxZoomOut || 5;

    this.sensitivity.x = opts.params?.sensitivity?.x || this.sensitivity.x;

    this.sensitivity.y = opts.params?.sensitivity?.y || this.sensitivity.y;

    this.heightOffset = opts.params?.heightOffset || 0;

    this.cameraAltitudeMaxDistance =
      opts.params?.cameraAltitudeMaxDistance || 25;

    this.cameraAltitudeSmoothing = opts.params?.cameraAltitudeSmoothing || 0.17;

    this.active = true;

    this.engine = Physics.get({ type: "rapier", debug: false });

    this.world = this.engine.world;

    this.smoothMethod = opts.params?.lerp || "orbit";

    this.init();

    (window as any).$tpc = this;
  }

  get smoothMethod() {
    //
    return this._lerpByPos ? "position" : "orbit";
  }

  set smoothMethod(value: "position" | "orbit") {
    this._lerpByPos = value === "position";
  }

  get smoothFactor() {
    //
    return this._lerpFactor;
  }

  set smoothFactor(value) {
    this._lerpFactor = value;
  }

  /**
   * @internal
   */

  _ray: any = null;

  /**
   * @internal
   */
  raycast(origin, direction, distance) {
    if (this._ray == null) {
      this._ray = new this.engine.RAPIER.Ray(origin, direction);
    }

    this._ray.origin = origin;
    this._ray.dir = direction;

    const cast = this.world.castRay(
      this._ray,
      distance,
      false,
      null,
      null,
      null,
      null,
      (collider) => {
        if (collider.isSensor()) {
          return false;
        }

        if (collider == this.target?.collider?._collider) {
          return false;
        }

        // TEMP: filter out players
        if ((collider.parent().userData as any)?.rigidbodyType === "PLAYER") {
          return false;
        }

        return true;
      }
    );

    return {
      distance: cast?.toi || null,
    };
  }

  /**
   * activates or deactivates the controls
   *
   * @param {boolean} value - true to activate, false to deactivate
   */
  set active(value: boolean) {
    if (this.controller) {
      this.controller.active = value;
    }

    this._active = value;

    if (value) {
      this.addEvents();
    } else {
      this.removeEvents();
    }
  }

  /**
   * Returns true if the controls are active, false otherwise
   */
  get active() {
    return this._active;
  }

  /**
   * Controls wether the controls should use pointer lock or not, if true clicking on the canvas will lock the pointer
   * and the target will move by simply moving the mouse, if false the camera will move by clicking and dragging the mouse
   */
  set usePointerLock(value) {
    this.controller.usePointerLock = value;
  }

  /**
   * Returns true if the controls are using pointer lock, false otherwise
   */
  get usePointerLock() {
    return this.controller.usePointerLock;
  }

  /**
   * Represents the maximum distance from the target object
   */
  get maxZoomOut() {
    return this._maxZoomOut;
  }

  /**
   * Changes the maximum distance from the target object
   */
  set maxZoomOut(value) {
    this.currentZoom = value;

    this._maxZoomOut = value;
  }

  /**
   * @internal
   */
  addEvents() {
    Emitter.on(Events.AFTER_PHYSICS_UPDATE, this.update);
  }

  /**
   * @internal
   */
  removeEvents() {
    Emitter.off(Events.AFTER_PHYSICS_UPDATE, this.update);
  }

  /**
   * @internal
   */
  private getCameraHeight = () => {
    if (!this.target.getDimensions) return 10;

    // console.log("dimensions", this.target.getDimensions() )

    return this.target.getDimensions().y;
  };

  private sphericalToVec3(r, theta, phi, out) {
    const cosPhiRadius = r * Math.cos((phi * Math.PI) / 180);

    out.set(
      cosPhiRadius * Math.sin((theta * Math.PI) / 180),

      r * Math.sin((phi * Math.PI) / 180),

      cosPhiRadius * Math.cos((theta * Math.PI) / 180)
    );
  }

  /**
   * @internal
   */
  computeInitialRadius = () => {
    let distance = this.cameraCollision();

    this.targetSpherical.radius = Math.min(distance, this.currentZoom);

    this.radius = this.targetSpherical.radius;
  };

  /**
   * @internal
   */
  move(deltaX, deltaY) {
    //
    if (this.lockAxis.x) {
      deltaY = 0;
    }
    if (this.lockAxis.y) {
      deltaX = 0;
    }

    let ratioXY = Math.abs(deltaY / deltaX);

    let factorX = 1;

    let factorY = 1;

    if (ratioXY < this.minRatioToRotateY) {
      factorY = 0.5;
    } else {
      factorX = 0.5;
    }

    if (IS_TOUCH) {
      factorY *= 2;

      factorX *= 3;
    }

    deltaX *= factorX;

    deltaY *= factorY;

    if (IS_MOBILE) {
      deltaX = -deltaX;

      deltaY = -deltaY;
    }

    this.targetSpherical.theta -= deltaX * (this.sensitivity.x / 80);

    this.targetSpherical.phi -= deltaY * (this.sensitivity.y / 80);

    this.restrictSpherical(this.targetSpherical);
  }

  /**
   * @internal
   */
  onWheel = (deltaY) => {
    if (this.disableWheelZoom) return;

    this.currentZoom = Clamp(
      0.1,
      this.maxZoomOut,
      this.currentZoom + deltaY * 0.1
    );
  };

  /**
   * @internal
   */
  initNearPlaneCorner() {
    const near = this.object.near;

    const fov = this.object.getEffectiveFOV() * MathUtils.DEG2RAD;

    const heightHalf = Math.tan(fov * 0.5) * near; // near plain half height

    const widthHalf = heightHalf * this.object.aspect; // near plain half width

    this.nearPlaneCorners[0].set(-widthHalf, -heightHalf, 0);

    this.nearPlaneCorners[1].set(widthHalf, -heightHalf, 0);

    this.nearPlaneCorners[2].set(widthHalf, heightHalf, 0);

    this.nearPlaneCorners[3].set(-widthHalf, heightHalf, 0);

    return this.nearPlaneCorners;
  }

  // _points = Array(4)
  //     .fill(0)
  //     .map(
  //         () =>
  //             new Mesh(
  //                 new SphereGeometry(0.1),
  //                 new MeshBasicMaterial({ color: 0xffff00 })
  //             )
  //     );

  // _arrows = Array(4)
  //     .fill(0)
  //     .map(() => new ArrowHelper());

  /**
   * @internal
   */
  cameraCollision = () => {
    if (this.disableCollision) return this.currentZoom;

    const currentZoom = this.currentZoom;

    const previousRad = this.targetSpherical.radius;

    this.targetSpherical.radius = currentZoom;

    cartv3.setFromSpherical(this.targetSpherical);

    this.cameraDistance.set(
      this.cameraVirtualTarget.x + cartv3.x,
      this.cameraVirtualTarget.y + this.cameraHeight + cartv3.y,
      this.cameraVirtualTarget.z + cartv3.z
    );

    let distance = currentZoom;

    const playerCenter = new Vector3().copy(this.cameraVirtualTarget);

    playerCenter.y += this.cameraHeight - this.heightOffset;

    const nearPlaneCorners = this.initNearPlaneCorner();

    const direction = this.playerCameraWorldDir
      .subVectors(this.cameraDistance, playerCenter)
      .normalize();

    // direction.y = 0.0

    this.rotationMatrix.lookAt(this.origin, direction, this.object.up);

    for (let i = 0; i < nearPlaneCorners.length; i++) {
      const nearPlaneCorner = nearPlaneCorners[i];

      nearPlaneCorner.applyMatrix4(this.rotationMatrix);

      const origin = this.originVec.addVectors(playerCenter, nearPlaneCorner);

      // const point = this._points[i];
      // point.position.copy(origin);
      // const arrow = this._arrows[i];

      // arrow.position.copy(point.position);
      // arrow.setDirection(direction);
      // arrow.setLength(this.maxZoomOut);

      // if (!point.parent) {
      //     scene.add(point);
      // }

      // if (!arrow.parent) {
      //     scene.add(arrow);
      // }

      const result = this.raycast(origin, direction, distance);

      // arrow.userData.length = result?.distance || Infinity;

      if (result && result.distance < distance) {
        if (result.distance > 0) {
          distance = result.distance;
          // arrow.setColor(0xff0000);
          // point.material.color.set(0xff0000);
        } else {
          // arrow.setColor(0x00ffff);
          // point.material.color.set(0x00ffff);
        }
      }
    }

    this.targetSpherical.radius = previousRad;

    this.targetSpherical.makeSafe();

    return distance < 0 ? 0.01 : distance;
  };

  /**
   * @internal
   */
  init(ignoreTargetDirection = false) {
    //
    const targetDir = new Vector3(0, 0, 1);

    if (!ignoreTargetDirection) {
      this.target.getWorldDirection?.(targetDir);
    }

    const target = this.target.position.clone();

    if (target.x == 0 && target.y == 0 && target.z == 0) {
      //
      this.object.position.copy(this.target.position);

      this.object.position.z += 3;
      this.object.position.y += 3;
      this.object.position.x += 3;
    }

    target.y += this.getCameraHeight() + this.heightOffset;

    offset.copy(targetDir).multiplyScalar(this.currentZoom);

    this.targetSpherical.setFromVector3(offset);

    this.restrictSpherical(this.targetSpherical);

    this.targetSpherical.radius = this.currentZoom;

    offset.setFromSpherical(this.targetSpherical);

    this.spherical.copy(this.targetSpherical);

    this.object.position.copy(this.target.position).add(offset);

    this.object.lookAt(this.target.position);

    this.object.updateMatrix();
  }

  saveState = () => {
    return {
      spherical: this.spherical.clone(),
      targetSpherical: this.targetSpherical.clone(),
      idealCameraPosition: this.idealCameraPosition.clone(),
      idealCameraTarget: this.idealCameraTarget.clone(),
      cameraPosition: this.cameraPosition.clone(),
      cameraTarget: this.cameraTarget.clone(),
      cameraHeight: this.cameraHeight,
      theta: this.theta,
      phi: this.phi,
      currentZoom: this.currentZoom,
    };
  };

  loadState = (state) => {
    this.spherical.phi = state.spherical.phi;

    this.spherical.theta = state.spherical.theta;

    this.spherical.radius = state.spherical.radius;

    this.targetSpherical.phi = state.targetSpherical.phi;

    this.targetSpherical.theta = state.targetSpherical.theta;

    this.targetSpherical.radius = state.targetSpherical.radius;

    this.idealCameraPosition.set(
      state.idealCameraPosition.x,
      state.idealCameraPosition.y,
      state.idealCameraPosition.z
    );

    this.idealCameraTarget.set(
      state.idealCameraTarget.x,
      state.idealCameraTarget.y,
      state.idealCameraTarget.z
    );

    this.cameraPosition.set(
      state.cameraPosition.x,
      state.cameraPosition.y,
      state.cameraPosition.z
    );

    this.cameraTarget.set(
      state.cameraTarget.x,
      state.cameraTarget.y,
      state.cameraTarget.z
    );

    this.cameraHeight = state.cameraHeight;

    this.currentZoom = state.currentZoom;

    this.update(10000);
  };

  /**
   * @internal
   */
  restrictSpherical(spherical: Spherical) {
    let min = -Infinity;
    let max = Infinity;

    if (isFinite(min) && isFinite(max)) {
      if (min < -Math.PI) min += twoPI;
      else if (min > Math.PI) min -= twoPI;

      if (max < -Math.PI) max += twoPI;
      else if (max > Math.PI) max -= twoPI;

      if (min <= max) {
        spherical.theta = Math.max(min, Math.min(max, spherical.theta));
      } else {
        spherical.theta =
          spherical.theta > (min + max) / 2
            ? Math.max(min, spherical.theta)
            : Math.min(max, spherical.theta);
      }
    }

    spherical.phi = Math.max(
      minPolarAngle,
      Math.min(maxPolarAngle, spherical.phi)
    );

    spherical.makeSafe();
  }

  /**
   * @internal
   */
  getIdealData() {
    this.update(100);

    return {
      position: this.idealCameraPosition.clone(),
      target: this.idealCameraTarget.clone(),
    };
  }

  private $$alpha = 0;

  lerpSpherical(spherical, target, alpha) {
    //
    this.$$alpha = alpha;

    spherical.radius = Mix(spherical.radius, target.radius, alpha);

    spherical.theta = Mix(spherical.theta, target.theta, alpha);

    spherical.phi = Mix(spherical.phi, target.phi, alpha);

    this.restrictSpherical(spherical);
  }

  $$lerp = {
    dt: 0,
    a: 0,
  };

  /**
   * @internal
   */
  update = (deltaTime) => {
    const targetAltitude = this.target.position.y;

    const reduction =
      Math.min(
        1,
        Math.abs(this.cameraVirtualTarget.y - targetAltitude) /
          this.cameraAltitudeMaxDistance
      ) ** 1.8;

    this.cameraVirtualTarget.set(
      this.target.position.x,
      lerp(
        lerp(
          this.cameraVirtualTarget.y,
          targetAltitude,
          Math.min(1, deltaTime / this.cameraAltitudeSmoothing)
        ),
        targetAltitude,
        reduction
      ),
      this.target.position.z
    );

    this.cameraHeight = this.getCameraHeight() + this.heightOffset;

    const baseLerp = 1.0 - Math.pow(0.001, deltaTime);

    const LERP_ALPHA = 1 - this._lerpFactor * (1 - baseLerp);

    this.$$lerp.dt = deltaTime;
    this.$$lerp.a = LERP_ALPHA;

    this.radius = MathUtils.lerp(this.radius, this.targetSpherical.radius, 0.1);

    let distance = this.cameraCollision();

    /*

            alpha  :  0  -> 1
            factor :  0  -> 1

        */

    const isClipped = distance < this.currentZoom;

    this.targetSpherical.radius = Math.min(distance, this.currentZoom);

    if (!this._lerpByPos) {
      this.lerpSpherical(
        this.spherical,
        this.targetSpherical,
        isClipped ? baseLerp : LERP_ALPHA
      );
    } else {
      //
      this.spherical.copy(this.targetSpherical);
    }

    cartv3.setFromSpherical(this.spherical);

    this.idealCameraPosition.set(
      this.cameraVirtualTarget.x + cartv3.x,
      this.cameraVirtualTarget.y + this.cameraHeight + cartv3.y,
      this.cameraVirtualTarget.z + cartv3.z
    );

    // debugger;
    // debugger;

    // console.log(cartv3,  this.idealCameraPosition )

    this.idealCameraTarget.set(
      this.cameraVirtualTarget.x,
      this.cameraVirtualTarget.y + this.cameraHeight - this.heightOffset,
      this.cameraVirtualTarget.z
    );

    // this.cameraPosition.lerp(this.idealCameraPosition, LERP_ALPHA);

    this.cameraTarget.lerp(this.idealCameraTarget, LERP_ALPHA);

    if (this._lerpByPos) {
      //
      this.object.position.lerp(this.idealCameraPosition, LERP_ALPHA);
    } else {
      //
      this.object.position.copy(this.idealCameraPosition);
    }

    this.object.updateMatrix();

    // console.log( this.idealCameraPosition )
    // console.log( this.idealCameraPosition )
    // console.log( this.idealCameraPosition )
    // console.log( this.idealCameraPosition )
    // console.log( this.idealCameraPosition )
    // console.log( this.idealCameraTarget, )

    if (!this.target.visible) {
      this.object.rotation.y = MathUtils.degToRad(this.spherical.theta);

      this.object.rotation.x = -MathUtils.degToRad(this.spherical.phi);
    } else {
      this.object.lookAt(this.idealCameraTarget); // this.cameraTarget for lerp vals
    }
  };
}
