// @ts-check

import { Frustum, Matrix4, PerspectiveCamera, Object3D } from "three";

import Emitter from "engine/events/emitter";

import Events from "engine/events/events";

import MainCamera from "./main.js";

import audioListener from "engine/globals/audiolistener";

import { USER_INTERACTED } from "engine/constants";

/**
 * @public
 */
export class Camera {
  //
  constructor() {
    this.dummy = new PerspectiveCamera();

    this.current = MainCamera;

    this.frustum = new Frustum();

    this.projScreenMatrix = new Matrix4();

    this.addEvents();

    globalThis["$cam"] = this;
  }

  update() {
    this.updateFrustum();
  }

  updateFrustum(camera = null) {
    //
    const cam = camera ? camera : this.current;

    this.projScreenMatrix.multiplyMatrices(
      cam.projectionMatrix,
      cam.matrixWorldInverse
    );

    this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
  }

  /**
   *
   * @param { Object3D } object
   * @returns { boolean }
   */
  isObjectVisible(object) {
    return this.frustum.intersectsObject(object);
  }

  addEvents() {
    Emitter.on(Events.PRE_UPDATE, this.update.bind(this));
  }

  set current(val) {
    if (this._current?.desactive) {
      this._current.desactive();
    }

    this._current = val;

    if (this._current.activate) {
      this._current.activate();
    }

    this.#addAudioListener();
  }

  get current() {
    return this._current;
  }

  #addAudioListener() {
    // this.current.add(audioListener);

    USER_INTERACTED.then(() => {
      if (audioListener.context.state != "running") {
        audioListener.context.resume();
      }
    });

    // console.log("switch audio listener parent", audioListener);
  }
}

export default new Camera();
