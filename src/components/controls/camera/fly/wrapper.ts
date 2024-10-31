import { ControlsAbstract } from "../../abstract";

import Events from "engine/events/events.js";

import Emitter from "engine/events/emitter";
import { Controller } from "./controller";
import {
  IS_MOBILE,
  IS_POINTER_LOCK,
  IS_TOUCH,
  ORIENTATION,
  PORTRAIT,
} from "engine/constants";
import { Euler, MOUSE, Quaternion } from "three";
import Clamp from "engine/utils/math/clamp";
import Smoothstep from "engine/utils/math/smoothstep";

/**
 * @public
 *
 * The class is used to implement fly camera controls.
 *
 * It takes in the `object` parameter which is the camera object being controlled
 *
 *
 */
export class FlyCameraControlsWrapper extends ControlsAbstract {
  /**
   * @internal
   */
  params = {
    lerp: 0.02,

    plerp: 0.7,

    moveSpeed: 10,

    rotateSpeed: 1.2,

    rotateCZSpeed: 30,

    minRatioToRotateY: 0.5,

    isPressingThreshold: 0.12,

    rotateThreshold: 0.5,
  };

  /**
   * @internal
   */
  actions = {
    backward: false,

    forward: false,

    left: false,

    right: false,

    up: false,

    down: false,

    panLeft: false,

    panRight: false,
  };

  /**
   * @internal
   */
  private rotationConversion = {
    dxToRad: 1,

    dyToRad: 1,
  };

  /**
   * @internal
   */
  private euler = new Euler(0, 0, 0, "YXZ");

  /**
   * @internal
   */
  private dragMode = false;

  /**
   * @internal
   */
  private isPressing = false;

  /**
   * @internal
   */
  private accuRotation = 0;

  /**
   * @internal
   */
  private mouseXtouch = 0;

  /**
   * @internal
   */
  private isPressingTimer = 0;

  /**
   * @internal
   */
  private targetQuat = null;

  /**
   * @internal
   */
  private _isDragging = false;
  //

  /**
   * @internal
   */
  constructor(opts) {
    //
    super(opts);

    this.controller = new Controller(this);

    this.onResize();

    this.active = true;
    debugger;
    this.params = {
      ...this.params,

      lerp: opts.params?.lerp || this.params.lerp,

      plerp: opts.params?.plerp || this.params.plerp,

      moveSpeed: opts.params?.moveSpeed || this.params.moveSpeed,

      rotateSpeed: opts.params?.rotateSpeed || this.params.rotateSpeed,

      rotateCZSpeed: opts.params?.rotateCZSpeed || this.params.rotateCZSpeed,

      minRatioToRotateY:
        opts.params?.minRatioToRotateY || this.params.minRatioToRotateY,

      isPressingThreshold:
        opts.params?.isPressingThreshold || this.params.isPressingThreshold,

      rotateThreshold:
        opts.params?.rotateThreshold || this.params.rotateThreshold,
    };
  }

  /**
   * activates or deactivates the controls
   *
   * @param {boolean} value - true to activate, false to deactivate
   */
  set active(value) {
    //

    if (value === this.active) return;

    this._active = value;

    this.controller.active = value;

    if (value) {
      //
      this.addEvents();
    } else {
      //
      this.removeEvents();
    }

    this.reset();
  }

  /**
   * Returns true if the controls are active, false otherwise
   */
  get active() {
    //
    return this._active;
  }

  /**
   * @internal
   */
  addEvents = () => {
    //
    Emitter.on(Events.DAWN_UPDATE, this.update);

    Emitter.on(Events.RESIZE, this.onResize);

    Emitter.on(Events.MOUSE_DOWN, this._handleMouseDown);

    Emitter.on(Events.MOUSE_UP, this._handleMouseUp);

    Emitter.on(Events.MOUSE_MOVE, this._handleMouseMove);
  };

  /**
   * @internal
   */
  removeEvents = () => {
    //
    Emitter.off(Events.DAWN_UPDATE, this.update);

    Emitter.off(Events.RESIZE, this.onResize);

    Emitter.off(Events.MOUSE_DOWN, this._handleMouseDown);

    Emitter.off(Events.MOUSE_UP, this._handleMouseUp);

    Emitter.off(Events.MOUSE_MOVE, this._handleMouseMove);
  };

  /**
   * @internal
   */
  _handleMouseUp = (event) => {
    this._isDragging = false;

    if (IS_TOUCH) {
      this.isPressing = false;

      this.accuRotation = 0;
    }
  };

  /**
   * @internal
   */
  _handleMouseDown = (event) => {
    this._isDragging = true;

    if (IS_TOUCH) {
      if (this.isPressing) return;

      this.accuRotation = 0;

      this.mouseXtouch = event.normalized.x;

      this.isPressing = true;

      this.isPressingTimer = 0;
    }
  };

  /**
   * @internal
   */
  _handleMouseMove = (event) => {
    const enableMove =
      IS_TOUCH ||
      (this.dragMode && this._isDragging) ||
      (!this.dragMode && IS_POINTER_LOCK());

    if (!enableMove) return;

    let movementX = 0;

    let movementY = 0;

    for (let i = 0; i < event.mousemovePackets.length; i++) {
      movementX += event.raw.dx;

      movementY += event.raw.dy;
    }

    if (IS_TOUCH) {
      this.mouseXtouch = event.normalized.x;

      if (IS_MOBILE) {
        this.mouseXtouch *= -1;
      }

      if (
        this.isPressingTimer < this.params.isPressingThreshold &&
        Math.abs(movementX) > this.params.rotateThreshold
      ) {
        this.isPressing = false;
      }
    }

    this.setRotationFromMouseMovement(movementX, movementY);
  };

  /**
   * @internal
   */
  setRotationFromMouseMovement = (movementX, movementY) => {
    let ratioXY = Math.abs(movementY / movementX);

    let factorX = 1;

    let factorY = 1;

    if (ratioXY < this.params.minRatioToRotateY) {
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

    if (this.targetQuat == null) {
      this.targetQuat = new Quaternion();

      this.targetQuat.copy(this.object.quaternion);
    }

    this.euler.setFromQuaternion(this.targetQuat);

    const dir = this.dragMode ? 1 : -1;

    this.euler.y +=
      dir *
      movementX *
      this.rotationConversion.dxToRad *
      this.params.rotateSpeed;

    this.euler.x +=
      dir *
      movementY *
      this.rotationConversion.dyToRad *
      this.params.rotateSpeed;

    this.euler.x = Clamp(-Math.PI / 2, Math.PI / 2, this.euler.x);

    this.targetQuat.setFromEuler(this.euler);
  };

  /**
   * @internal
   */
  onResize = () => {
    // Update rotation speed
    if (!IS_TOUCH) {
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
  reset() {
    //
    this.actions = {
      backward: false,

      forward: false,

      left: false,

      right: false,

      up: false,

      down: false,

      panLeft: false,

      panRight: false,
    };

    this.isPressing = false;

    this.accuRotation = 0;

    this.mouseXtouch = 0;

    this.isPressingTimer = 0;

    this.targetQuat = null;

    this._isDragging = false;
  }

  /**
   * @internal
   */
  update = (deltaTime) => {
    if (this.isPressing) {
      const ratio = Smoothstep(0.8, 1.0, Math.abs(this.mouseXtouch));

      this.accuRotation += -Math.sign(this.mouseXtouch) * ratio * 0.001;

      this.accuRotation = Math.max(Math.min(this.accuRotation, 0.03), -0.03);

      if (ratio == 0) {
        this.accuRotation = 0;
      }
    } else {
      this.mouseXtouch = 0;

      this.accuRotation = 0;
    }

    if (this.targetQuat) {
      this.euler.setFromQuaternion(this.targetQuat);

      if (this.isPressing) {
        this.euler.setFromQuaternion(this.targetQuat);

        this.euler.y -= this.accuRotation;

        this.targetQuat.setFromEuler(this.euler);
      }
    }

    let speedFactor;

    if (IS_TOUCH) {
      let touchGo = false;

      if (this.isPressing) {
        this.isPressingTimer += deltaTime;

        if (this.isPressingTimer > this.params.isPressingThreshold) {
          touchGo = true;
        }
      }

      if (touchGo) {
        speedFactor = 1;

        this.actions.forward = true;
      } else {
        speedFactor = 0;

        this.actions.forward = false;
      }
    }

    if (this.targetQuat) {
      if (IS_MOBILE) {
        this.object.quaternion.slerp(
          this.targetQuat,
          this.isPressing ? 1 : 0.1
        );
      } else {
        this.object.quaternion.slerp(this.targetQuat, this.params.lerp);
      }
    }

    if (speedFactor == null) {
      speedFactor = 1;
    }

    if (this.actions.up) {
      this.object.position.y += this.params.moveSpeed * deltaTime;
    }

    if (this.actions.down) {
      this.object.position.y -= this.params.moveSpeed * deltaTime;
    }

    if (this.actions.forward) {
      this.object.translateZ(-speedFactor * this.params.moveSpeed * deltaTime);
    }

    if (this.actions.backward) {
      this.object.translateZ(speedFactor * this.params.moveSpeed * deltaTime);
    }

    if (this.actions.left) {
      this.object.translateX(-speedFactor * this.params.moveSpeed * deltaTime);
    }

    if (this.actions.right) {
      this.object.translateX(speedFactor * this.params.moveSpeed * deltaTime);
    }
  };

  /**
   * @internal
   */
  dispose(): void {
    this.active = false;
  }
}
