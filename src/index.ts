// @ts-check
import Events from "engine/events/events";
import Emitter from "engine/events/emitter";
import {
  SET_CURRENT_STATE,
  SET_GPU_TIER,
  APP_STATES,
  CANVAS,
  CURRENT_STATE,
  SET_EDIT_MODE,
} from "engine/constants";
import { getGPUTier } from "detect-gpu";
import Mediator from "./events/mediator";
import { World } from "./world";
import { SetStateFn } from "./@types/states";
import { Space } from "./space/wrapper";
import audioListener from "./globals/audiolistener";

export class Engine {
  canvas: HTMLCanvasElement = null;

  ready: Promise<void> = null;

  private world: World = null;

  constructor() {
    this.canvas = CANVAS;
    this.ready = this.#preload();
  }

  async #preload() {
    if (__BUILD_TARGET__ === "web") {
      SET_GPU_TIER(await getGPUTier());
    }

    this.world = new World();

    this.world.start();

    await this.world.preload();
  }

  async play() {
    if (__BUILD_TARGET__ === "web") {
      Mediator.play();
    }
  }

  async pause() {
    if (__BUILD_TARGET__ === "web") {
      Mediator.pause();
    }
  }
  y;

  get isPlaying() {
    return Mediator._isPlaying;
  }

  async resize(opts = { w: 1024, h: 1024 }) {
    if (__BUILD_TARGET__ === "web") {
      Mediator.resize(opts);
    }
  }

  async notify(event: string, data?: any) {
    Emitter.emit(event, data);
  }

  setState: SetStateFn = async (STATE, opts) => {
    //
    const res = await this.world.setState(STATE, opts);

    SET_CURRENT_STATE(STATE);

    return res;
  };

  showIntro() {
    //
    return this.world.showIntro();
  }

  hideIntro() {
    //
    return this.world.hideIntro();
  }

  setEditMode(val: boolean) {
    //
    SET_EDIT_MODE(val);
  }

  getState() {
    return CURRENT_STATE;
  }

  getCurrentSpace(): Space {
    return this.world.getCurrentSpace();
  }

  on(event: string, cb: Function) {
    Emitter.on(event, cb);
    return () => {
      Emitter.off(event, cb);
    };
  }

  once(event: string, cb: Function) {
    Emitter.once(event, cb);
  }

  off(event: string, cb: Function) {
    Emitter.off(event, cb);
  }

  getAudioListener() {
    return audioListener;
  }

  private static instance: Engine = null;

  static getInstance() {
    if (!Engine.instance) {
      Engine.instance = new Engine();
    }

    return Engine.instance;
  }

  static Events = Events;

  static APP_STATES = APP_STATES;

  Events = Events;

  Emitter = Emitter;

  APP_STATES = APP_STATES;
}

export type { Space };

export type { Game } from "./@types/game";

export type { AppState, AppStateOpts } from "./@types/states";

export type { GameSignals } from "./@types/signals";

export type { ComponentTypeMap as ComponentTypes } from "./space/components/components";

import Controls from "engine/components/controls";

export { Controls };

import Camera from "engine/camera";

export { Camera };

if (__BUILD_TARGET__ === "node") {
  // @ts-ignore
  globalThis.ProgressEvent = ProgressEvent;
}

export { GameLoader } from "./gameloader";
