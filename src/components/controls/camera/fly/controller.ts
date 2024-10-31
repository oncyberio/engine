import Events from "engine/events/events.js";

import Emitter from "engine/events/emitter";

export class Controller {
  private _active: boolean = false;

  public onInput = null;

  private _showJoystick: boolean = false;

  constructor(private controls) {}

  get active() {
    return this._active;
  }

  set active(value) {
    if (value === this._active) return;

    this._active = value;

    this.showJoystick = value;

    if (value) {
      this.addEvents();
    } else {
      this.removeEvents();
    }
  }

  set showJoystick(value) {
    if (value === this._showJoystick) return;

    this._showJoystick = value;

    if (value) {
      const joystick = document.getElementById("phantom-joystick");

      if (joystick) {
        joystick.style.display = "block";
      }

      window.addEventListener("joystick", this.onJoystick, {
        capture: true,
      });
    } else {
      const joystick = document.getElementById("phantom-joystick");

      if (joystick) {
        joystick.style.display = "none";
      }

      window.removeEventListener("joystick", this.onJoystick, {
        capture: true,
      });
    }
  }

  get showJoystick() {
    return this._showJoystick;
  }

  addEvents = () => {
    Emitter.on(Events.KEY_DOWN, this.onKeyDown);

    Emitter.on(Events.KEY_UP, this.onKeyUp);
  };

  removeEvents = () => {
    Emitter.off(Events.KEY_DOWN, this.onKeyDown);

    Emitter.off(Events.KEY_UP, this.onKeyUp);
  };

  onJoystick = (event) => {
    this.controls.actions.forward = event.detail.dirs.includes("up");

    this.controls.actions.backward = event.detail.dirs.includes("down");

    this.controls.actions.left = event.detail.dirs.includes("left");

    this.controls.actions.right = event.detail.dirs.includes("right");
  };

  onKeyDown = (event) => {
    let changed = false;

    if (event.code === "KeyW" || event.code === "ArrowUp") {
      this.controls.actions.forward = true;
      changed = true;
    }

    if (event.code === "KeyS" || event.code === "ArrowDown") {
      this.controls.actions.backward = true;
      changed = true;
    }

    if (event.code === "KeyA" || event.code === "ArrowLeft") {
      this.controls.actions.left = true;
      changed = true;
    }

    if (event.code === "KeyD" || event.code === "ArrowRight") {
      this.controls.actions.right = true;
      changed = true;
    }

    if (event.code === "KeyZ") {
      this.controls.actions.panLeft = true;

      this.controls.setRotationFromMouseMovement(
        -this.controls.params.rotateCZSpeed,
        0
      );

      changed = true;
    }

    if (event.code === "KeyC") {
      this.controls.actions.panRight = true;

      this.controls.setRotationFromMouseMovement(
        this.controls.params.rotateCZSpeed,
        0
      );

      changed = true;
    }

    if (event.code === "KeyQ") {
      this.controls.actions.up = true;

      changed = true;
    }

    if (event.code === "KeyE") {
      this.controls.actions.down = true;

      changed = true;
    }

    if (changed) {
      this.controls.actions._seq++;

      this.onInput?.(this.controls.actions);
    }
  };

  onKeyUp = (event) => {
    let changed = false;

    if (event.code === "KeyW" || event.code === "ArrowUp") {
      this.controls.actions.forward = false;
      changed = true;
    }

    if (event.code === "KeyS" || event.code === "ArrowDown") {
      this.controls.actions.backward = false;
      changed = true;
    }

    if (event.code === "KeyA" || event.code === "ArrowLeft") {
      this.controls.actions.left = false;
      changed = true;
    }

    if (event.code === "KeyD" || event.code === "ArrowRight") {
      this.controls.actions.right = false;
      changed = true;
    }

    if (event.code === "KeyZ") {
      this.controls.actions.panLeft = false;
      changed = true;
    }

    if (event.code === "KeyC") {
      this.controls.actions.panRight = false;
      changed = true;
    }

    if (event.code === "KeyQ") {
      this.controls.actions.up = false;

      changed = true;
    }

    if (event.code === "KeyE") {
      this.controls.actions.down = false;

      changed = true;
    }

    if (changed) {
      this.controls.actions._seq++;

      this.onInput?.(this.controls.actions);
    }
  };

  dispose() {
    this.active = false;
  }
}
