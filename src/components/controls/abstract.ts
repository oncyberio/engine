import { Euler, Object3D, Quaternion, Vector3 } from "three";

import Events from "engine/events/events";

import Emitter from "engine/events/emitter";
import { Component3D } from "engine/abstract/types";

/**
 * @public
 */
export class ControlsAbstract {
  /**
   * @internal
   */
  public target: any;

  protected _active: boolean = false;

  /**
   * @internal
   */
  public object: Component3D;

  /**
   * @internal
   */
  public controller: any;

  public name: string = "";

  /**
   * @internal
   */
  constructor(opts) {
    this.object = opts.object;

    this.target = opts.target || {
      position: new Vector3(0, 0, 0),

      rotation: new Euler(0, 0, 0),
    };

    this.name = opts.type;

    Emitter.once(Events.SPACE_DISPOSED, () => {
      this.dispose();
    });
  }

  /**
   * @internal
   */
  set active(value) {
    this._active = value;
  }

  /**
   * @internal
   */
  get active() {
    return this._active;
  }

  /**
   * @internal
   */
  dispose() {
    this.active = false;

    this.controller?.dispose();

    this.controller = null;
  }
}
