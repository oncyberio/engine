import Events from "engine/events/events.js";

import Emitter from "engine/events/emitter";

import { CANVAS, IS_MOBILE, IS_POINTER_LOCK, IS_TOUCH } from "engine/constants";

/**
 * @public
 *
 * This class is used to control the actions of the {@link FirstPersonControlsWrapper} class.
 */
export class Controller {
  private _active: boolean = false;

  private _usePointerLock: boolean = true;

  private _down: boolean = false;

  /**
   * @internal
   */
  constructor(private controls) {
    this._usePointerLock = true;
  }

  /**
   * Returns true if the controller is active.
   */
  get active() {
    return this._active;
  }

  /**
   * Activates/deactivates the controller.
   *
   * Deactivating the controller will prevent input events from influencing the {@link FirstPersonControlsWrapper}'s actions.
   */
  set active(value) {
    if (value) {
      this.addEvents();
    } else {
      this.removeEvents();
    }

    this._active = value;
  }

  /**
   * @internal
   */
  addEvents = () => {
    if (this.active) return;

    Emitter.on(Events.UPDATE, this.update);

    Emitter.on(Events.KEY_DOWN, this.onKeyDown);

    Emitter.on(Events.KEY_UP, this.onKeyUp);

    Emitter.on(Events.MOUSE_MOVE, this.onMouseMove);

    Emitter.on(Events.MOUSE_DOWN, this.onMouseDown);

    Emitter.on(Events.RESIZE, this.onResize);
  };

  /**
   * @internal
   */
  removeEvents = () => {
    if (!this.active) return;

    Emitter.off(Events.UPDATE, this.update);

    Emitter.off(Events.KEY_DOWN, this.onKeyDown);

    Emitter.off(Events.KEY_UP, this.onKeyUp);

    Emitter.off(Events.MOUSE_MOVE, this.onMouseMove);

    Emitter.off(Events.MOUSE_DOWN, this.onMouseDown);

    Emitter.off(Events.MOUSE_UP, this.onMouseUp);

    Emitter.off(Events.RESIZE, this.onResize);
  };

  /**
   * @internal
   */
  onMouseUp = (event) => {
    this._down = false;
  };

  /**
   * @internal
   */
  onMouseDown = (event) => {
    this._down = true;

    if (this.usePointerLock) {
      this.togglePointerLock(true);
    }
  };

  /**
   * @internal
   */
  togglePointerLock = (val) => {
    if (IS_TOUCH) {
      return;
    }

    if (val == true) {
      if (!IS_POINTER_LOCK()) {
        CANVAS?.requestPointerLock?.();
      }
    } else {
      if (IS_POINTER_LOCK()) {
        document.exitPointerLock();
        this._down = false;
      }
    }
  };

  /**
   * @internal
   */
  onMouseMove = (event) => {
    if (!IS_TOUCH) {
      if (this._usePointerLock) {
        if (!IS_POINTER_LOCK()) return;
      } else {
        if (this._down == false) return;
      }
    }

    // if (!event.isDragging) return;

    let movementX = 0;

    let movementY = 0;

    for (let i = 0; i < event.mousemovePackets.length; i++) {
      movementX += event.raw.dx;

      movementY += event.raw.dy;
    }

    this.controls.move(movementX, movementY);
  };

  /**
   * @internal
   */
  onKeyDown = (event) => {};

  /**
   * @internal
   */
  onKeyUp = (event) => {};

  /**
   * @internal
   */
  onResize = (event) => {
    this.controls.handleResize();
  };

  /**
   * @internal
   */
  update = (deltaTime: number) => {
    this.controls.update(deltaTime);
  };

  /**
   * Set whether or not to enter pointer lock mode when user clicks on the scene.
   */
  set usePointerLock(val) {
    this._usePointerLock = val;

    if (
      val && navigator?.userActivation
        ? navigator.userActivation.isActive
        : true
    ) {
      //

      this.togglePointerLock(val);
    } else {
      this.togglePointerLock(false);
    }
  }

  /**
   * Returns whether or not pointer lock mode is enabled.
   */
  get usePointerLock() {
    return this._usePointerLock;
  }

  /**
   * @internal
   */
  dispose() {
    this.active = false;
  }
}
