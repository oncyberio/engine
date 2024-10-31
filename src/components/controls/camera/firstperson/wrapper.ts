import {
  Euler,
  MathUtils,
  Matrix4,
  Quaternion,
  Ray,
  Vector2,
  Vector3,
} from "three";

import { ControlsAbstract } from "../../abstract";

import { Controller } from "./controller";

import { IS_MOBILE, IS_TOUCH, ORIENTATION, PORTRAIT } from "engine/constants";

import Clamp from "engine/utils/math/clamp";

import Events from "engine/events/events.js";

import Emitter from "engine/events/emitter";

/**
 * @public
 *
 * The class is used to implement first person camera controls.``
 *
 * The meaning of `object` & `target` options is intepreted as follows:
 *
 *   - The `object` is typically set to the camera object being controlled
 *
 *   - The `target` is the object that the camera will follow
 */
export class FirstPersonCameraControlsWrapper extends ControlsAbstract {
  /**
   * @internal
   */
  public euler = new Euler(0, 0, 0, "YXZ");

  /**
   * @internal
   */
  private targetQuat: Quaternion = new Quaternion();

  private minRatioToRotateY = Math.tan(Math.PI / 6);

  /**
   * @internal
   */
  public rotationConversion = {
    dxToRad: 1,

    dyToRad: 1,
  };

  /**
   * @internal
   */
  constructor(opts) {
    super(opts);

    this.controller = new Controller(this);

    this.active = true;

    this.targetQuat.copy(this.object.quaternion);

    this.handleResize();

    this.object.rotation.order = "YXZ";
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

    if (!value) {
      this.targetQuat = new Quaternion();
    }

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
   * @internal
   */
  addEvents() {
    Emitter.on(Events.DAWN_UPDATE, this.update);
  }

  /**
   * @internal
   */
  removeEvents() {
    Emitter.off(Events.DAWN_UPDATE, this.update);
  }

  private getCameraHeight = () => {
    if (!this.target.getDimensions) return 10;

    return this.target.getDimensions().y;
  };

  /**
   * @internal
   */
  handleResize = () => {
    if (!IS_TOUCH) {
      const SPEED = 0.0018;

      this.rotationConversion.dxToRad = Math.PI / window.innerWidth;

      this.rotationConversion.dyToRad = Math.PI / window.innerHeight;
    } else {
      const SPEED = -0.0043;

      const BASE_WIDTH =
        window.innerWidth / (ORIENTATION === PORTRAIT ? 390 : 844); // 390 dimensions of iphone 12 pro

      const BASE_HEIGHT =
        window.innerHeight / (ORIENTATION === PORTRAIT ? 844 : 390);

      this.rotationConversion.dxToRad = SPEED * BASE_WIDTH;

      this.rotationConversion.dyToRad =
        (SPEED / (ORIENTATION === PORTRAIT ? 4 : 3)) * BASE_HEIGHT;
    }
  };

  /**
   * @internal
   */
  move(movementX, movementY) {
    let ratioXY = Math.abs(movementY / movementX);

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

    movementX *= factorX;

    movementY *= factorY;

    if (IS_MOBILE) {
      movementX = -movementX;

      movementY = -movementY;
    }

    this.euler.setFromQuaternion(this.object.quaternion);

    this.euler.setFromQuaternion(this.targetQuat);

    this.euler.y -= movementX * this.rotationConversion.dxToRad;

    this.euler.x -= movementY * this.rotationConversion.dyToRad;

    this.euler.x = Clamp(-Math.PI / 2, Math.PI / 2, this.euler.x);

    this.targetQuat.setFromEuler(this.euler);
  }

  /**
   * @internal
   */
  update = (deltaTime) => {
    if (!this.active) return;

    this.object.position.set(
      this.target.position.x,

      this.target.position.y + this.getCameraHeight(),

      this.target.position.z
    );

    this.object.quaternion.copy(this.targetQuat);
  };

  /**
   * @internal
   */
  dispose() {
    super.dispose();

    this.targetQuat = new Quaternion();
  }
}
