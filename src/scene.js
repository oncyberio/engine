import { Scene as THREESCENE, Fog } from "three";

import { DEBUG } from "engine/constants";

import Emitter from "engine/events/emitter";

import Events from "engine/events/events";

class Scene extends THREESCENE {
  constructor() {
    super();

    if (DEBUG) {
      globalThis.scene = this;
    }

    this.matrixAutoUpdate = false;
  }

  onBeforeShadow(scene, camera, frustum) {
    camera.frustum = frustum;

    Emitter.emit(Events.PRE_RENDER, scene, camera);
  }

  setState() {
    return Promise.resolve();
  }
}

export default new Scene();
