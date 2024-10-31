import { Object3D } from "three";
import AbstractCamera from "./abstract";

import { FAR, FOV, NEAR } from "./constants.js";

import Controls from "engine/components/controls";

import { FirstPersonCameraControlsWrapper } from "engine/components/controls/camera/firstperson/wrapper";

import { ThirdPersonCameraControlsWrapper } from "engine/components/controls/camera/thirdperson/wrapper";

import { FlyCameraControlsWrapper } from "engine/components/controls/camera/fly/wrapper";

/**
 * @public
 *
 * Main camera used to render the scene, this is actually an instance of three.js {@link https://threejs.org/docs/index.html?q=Perspe#api/en/cameras/PerspectiveCamera | PerspectiveCamera}
 */
export class MainCamera extends AbstractCamera {
  /**
   * @internal
   */
  _controls = null;

  /**
   * @internal
   */
  constructor(fov, aspect, near, far) {
    super(fov, aspect, near, far);

    /**
     * @internal
     */
    this._usePointerLock = true;
  }

  /**
   * @internal
   */
  #mode = null;

  /**
   * @deprecated
   * @returns {"firstperson" | "thirdperson"} camera mode
   */
  get mode() {
    return this.#mode;
  }

  /**
   * Set the current camera mode, a camera mode is a way to control the camera, this property is used in combination
   * with the `target` property, the `target` property is the object that the camera will follow, if the camera mode is:
   *
   * - firstperson: the camera will stick the target object
   *
   * - thirdperson: the camera will follow the target object from a distance, you can use the `maxZoomOut` property to set the maximum distance
   *
   * - fly: the camera will be free to move around the scene without any target in a smooth way
   *
   * @deprecated
   * @param {"firstperson" | "thirdperson" | "fly"} type - camera mode
   */
  set mode(t = "thirdperson") {
    return this.useControls(t);
  }

  /**
   * @param {(string | any)} controls
   */
  useControls(controls) {
    if (!controls) {
      if (this._controls?.target) {
        this._controls.target = null;
      }

      if (this._controls) {
        this._controls.dispose();
        this.controls = null;
      }

      return this._controls;
    }

    if ((controls.type || controls) === this._controls?.name) return;

    const prevTarget = controls.target
      ? controls.target
      : this._controls?.target;

    if (this._controls) {
      this._controls.dispose();
    }

    if (typeof controls == "string") {
      this.#mode = controls;
      this.controls = Controls.get({
        type: controls,
        object: this,
        target: prevTarget,
        params: {
          maxZoomOut: 10,
        },
      });
    } else {
      this.#mode = controls.type;
      this.controls = controls;
    }

    this._controls.usePointerLock = this.usePointerLock;

    return this._controls;
  }

  /**
   * Returns the current camera controls, the type of the controls depends on the `mode` property:
   *
   * - if mode is `firstperson` the controls will be an instance of {@link FirstPersonCameraControlsWrapper}
   * - if mode is `thirdperson` the controls will be an instance of {@link ThirdPersonCameraControlsWrapper}
   * - if mode is `fly` the controls will be an instance of {@link FlyCameraControlsWrapper}
   *
   * @returns {FirstPersonCameraControlsWrapper | ThirdPersonCameraControlsWrapper | FlyCameraControlsWrapper} current camera controls
   */
  get controls() {
    return this._controls;
  }
  /**
   * @internal
   */
  set controls(val) {
    this._controls = val;
  }

  /**
   * Controls wether the camera controls should use pointer lock or not, if true clicking on the canvas will lock the pointer
   * and the camera will move by simply moving the mouse, if false the camera will move by clicking and dragging the mouse
   */
  set usePointerLock(val) {
    this._usePointerLock = val;

    if (this._controls) {
      this._controls.usePointerLock = val;
    }
  }

  /**
   * @returns {boolean} wether the camera controls should use pointer lock or not
   */
  get usePointerLock() {
    if (this._controls) {
      return this._controls.usePointerLock;
    }

    return this._usePointerLock;
  }

  /**
   * This is used in combination with the `useControls` method, this property is the object that the camera controls will follow
   *
   * @param {Object3D} val - target object
   */
  set target(val) {
    //
    if (this._controls == null) return;

    const oldTarget = this._controls.target;

    if (oldTarget != val) {
      //
      this._controls.target = val;

      this._controls?.init?.();
    }
  }

  /**
   * @returns {Object3D} target object
   */
  get target() {
    return this._controls?.target;
  }

  /**
   * Represents the maximum distance from the target object, this is used in combination with the `useControls` method.
   *
   * @returns {number} maximum distance from the target object
   */
  get maxZoomOut() {
    return this._controls?.maxZoomOut;
  }

  /**
   * Used to set the maximum distance from the target object, this is used in combination with the `useControls` method.
   *
   * @param {number} val - maximum distance from the target object
   */
  set maxZoomOut(val) {
    if (this._controls) {
      this._controls.maxZoomOut = val;
    }
  }

  /**
   * @returns {boolean} wether the camera controls have disabled collision or not
   */
  get disableCollision() {
    if (this._controls) {
      return this._controls.disableCollision;
    }
  }

  /**
   * @returns {boolean} wether the camera controls should disable collision or not
   * @default false
   * @example
   * Camera.disableCollision = true;
   */
  set disableCollision(val) {
    if (this._controls) {
      this._controls.disableCollision = val;
    }
  }

  /**
   * @returns {boolean} wether the camera controls have disabled wheel zoom or not
   */
  get disableWheelZoom() {
    if (this._controls) {
      return this._controls.disableWheelZoom;
    }
  }

  /**
   * @returns {boolean} wether the camera controls should disable wheel zoom or not
   * @default false
   * @example
   * Camera.disableWheelZoom = true;
   */
  set disableWheelZoom(val) {
    if (this._controls) {
      this._controls.disableWheelZoom = val;
    }
  }

  /**
   * Used to set vertical offset from the target object, this is used in combination with the `useControls` method.
   *
   * @param {number} val - vertical offset from the target object
   */
  set heightOffset(val) {
    if (this._controls) {
      this._controls.heightOffset = val;
    }
  }

  /**
   * Returns vertical offset from the target object, this is used in combination with the `useControls` method.
   */
  get heightOffset() {
    return this._controls?.heightOffset;
  }

  /**
   * @internal
   */
  getShadowTarget() {
    return this.target || this;
  }

  /**
   * @internal
   */
  reset() {
    this.useControls(null);
  }

  // prevZ = 0;

  // updateMatrixWorld(force) {
  //     super.updateMatrixWorld(force);

  //     if (globalThis.isMoving) {
  //         const dy = this.position.y - this.prevZ;
  //         console.log("cam dy", dy, (this.position.y - 2.7).toFixed(2));
  //         this.prevZ = this.position.y;
  //     }
  // }
}

export default new MainCamera(FOV, 1, NEAR, FAR);
