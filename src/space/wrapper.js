// @ts-check

import Emitter from "engine/events/emitter";
import Events from "engine/events/events";
import Camera from "engine/camera";
import { ComponentManager } from "./components";
import AugmentedGroup from "engine/abstract/augmentedgroup";
import PhysicsRapierWrapper from "engine/components/physics/rapier/wrapper";
import { ResourceManager } from "./resources/resourcemanager";
import { ComponentsRegistry } from "./registry";

/**
 * @public
 *
 * Repersents the container for all objects in the scene for the current game.
 *
 * This class is a wrapper around the ThreeJS {@link https://threejs.org/docs/index.html?q=Group#api/en/objects/Group | Group } class.
 */
export class Space extends AugmentedGroup {
  #fog = null;
  #background = null;
  #lighting = null;
  #envMap = null;

  /**
   * @type { ComponentManager } - The component manager for the current game.
   */
  components = null;

  /**
   * @type { ResourceManager } - The resources manager for the current game.
   */
  resources = null;

  /**
   * @type { ComponentsRegistry } - The components registry for the current game.
   */
  registry = null;

  /**
   * @type { PhysicsRapierWrapper } - The physics manager for the current game. Currently only Rapier is supported.
   */
  physics = null;

  /**
   * @internal
   */
  _isReady = false;

  /**
   * @internal
   */
  _wasDisposed = false;

  /**
   * @internal
   *
   * @param { import("..").AppStateOpts["GAME"] } opts - Options for the space.
   */
  constructor(opts) {
    super();

    this.options = opts;

    this.matrixAutoUpdate = false;

    globalThis["$space"] = this;

    Emitter.once(Events.GAME_POST_READY, () => {
      //
      if (this._wasDisposed) return;

      this._isReady = true;
    });
  }

  get isReady() {
    return this._isReady;
  }

  /**
   * Returns the current camera in the scene. cf {@link MainCamera}
   */
  get camera() {
    return Camera.current;
  }

  /**
   * @internal
   */
  get background() {
    return this.#background;
  }

  /**
   * @internal
   */
  set background(val) {
    if (this.#background) {
      this.remove(this.#background);

      this.#background.dispose();
    }

    this.#background = val;

    if (this.#background != null) {
      this.add(this.#background);
    }
  }

  /**
   * @internal
   */
  set fog(value) {
    this.#fog = value;
  }

  /**
   * @internal
   */
  get fog() {
    return this.#fog;
  }

  /**
   * @internal
   */
  get lighting() {
    return this.#lighting;
  }

  /**
   * @internal
   */
  set lighting(value) {
    if (this.#lighting) {
      this.remove(this.#lighting);

      this.#lighting.dispose?.();
    }

    this.#lighting = value;

    if (this.#lighting != null) {
      this.add(this.#lighting);
    }
  }

  /**
   * @internal
   */
  set envMap(value) {
    this.#envMap = value;
  }

  /**
   * @internal
   */
  get envMap() {
    return this.#envMap;
  }

  /**
   * @internal
   */
  __checkBlocked() {
    //
    if (this.options.signals?.spacePermission$?.value.blocked) {
      throw new Error("Space blocked");
    }
  }

  /**
   * Use this method to start the current game.
   */
  start(payload = null) {
    this.__checkBlocked();
    Emitter.emit(Events.GAME_START, payload);
  }

  /**
   * Use this method to stop the current game.
   */
  stop(payload = null) {
    this.__checkBlocked();
    Emitter.emit(Events.GAME_END, payload);
  }

  /**
   * Use this method to pause the current game.
   */
  pause(payload = null) {
    this.__checkBlocked();
    Emitter.emit(Events.GAME_PAUSE, payload);
  }

  /**
   * Use this method to resume the current game.
   */
  resume(payload = null) {
    this.__checkBlocked();
    Emitter.emit(Events.GAME_RESUME, payload);
  }

  /**
   * @internal
   */
  _onEngineEvent(event, listener) {
    //
    Emitter.on(event, listener);

    return () => {
      //
      Emitter.off(event, listener);
    };
  }

  /**
   * @internal
   */
  dispose() {
    //
    if (this._wasDisposed) return;

    this._wasDisposed = true;

    this.components = null;

    this.physics = null;

    this.background = null;

    this.fog = null;

    this.lighting = null;

    this.envMap = null;

    this.options = null;
  }
}
