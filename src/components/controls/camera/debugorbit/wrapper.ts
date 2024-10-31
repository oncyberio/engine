import { Vector3 } from "three";
import { ControlsAbstract } from "../../abstract";

import { OrbitControls } from "./lib";

import { CANVAS, DEBUG } from "engine/constants";

const ORIGIN = new Vector3(
  -13.618742270968312,
  6.590822587274738,
  -50.55887160407464
);

const TARGET = new Vector3(
  -10.502310085718126,
  0.581587538499533,
  0.7745837808404059
);

/**
 * @public
 *
 * Those controls are for debug purposes only. OrbitControls performs orbiting, dollying (zooming), and panning.
 *
 * Orbit - left mouse / touch: one-finger move
 *
 * Zoom - middle mouse, or mousewheel / touch: two-finger spread or squish
 *
 * Pan - right mouse, or left mouse + ctrl/meta/shiftKey, or arrow keys / touch: two-finger move
 */
export class DebugOrbitControlsWrapper extends ControlsAbstract {
  /**
   * @internal
   */
  constructor(opts) {
    super(opts);

    this.object.position.copy(ORIGIN);

    this.active = true;
  }

  /**
   * Returns true if the controller is active.
   */
  get active() {
    return this._active;
  }

  /**
   * Activates/deactivates the controller.
   */
  set active(value) {
    this._active = value;

    if (this._active) {
      if (this.controller == null) {
        this.controller = new OrbitControls(this.object, CANVAS);

        this.controller.target.copy(TARGET);

        this.controller.enableRotate = true;

        this.controller.listenToKeyEvents(window);

        this.controller.update();
      }
    } else {
      if (this.controller) {
        this.controller.dispose();

        this.controller = null;
      }
    }
  }
}
