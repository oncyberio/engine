// @ts-check

import Emitter from "engine/events/emitter";

import Events from "engine/events/events";

import { Group } from "three";

import { APP_STATES, SET_SHADOW_NEEDS_UPDATE } from "engine/constants";

import SpaceFactory from "engine/space";

import StarfieldTunnel from "./scenes/tunnel";

import Camera from "engine/camera";

export default class Root extends Group {
  constructor() {
    super();

    this.name = "ROOT";

    this.matrixAutoUpdate = false;

    this.avatars = [];

    this.lobby = null;

    this.currentAvatarIndex = 0;

    this.currentSpace = null;
  }

  async preload() {
    var ps = [];

    await StarfieldTunnel.preload();

    return Promise.all(ps).then((res) => {
      // this.tunnel = Tunnel.get()
    });
  }

  async showIntro() {
    await StarfieldTunnel.setState(APP_STATES.INTRO);
  }

  async hideIntro() {
    this.currentSpace.visible = true;
    SET_SHADOW_NEEDS_UPDATE(true);
    await StarfieldTunnel.setState(APP_STATES.GAME);
  }

  /**
   *
   * @type { import('./@types/states').SetStateFn }
   */
  async setState(STATE, opts) {
    return new Promise(async (resolve) => {
      let ps = [];

      var space;

      switch (STATE) {
        case APP_STATES.INTRO:
          // await StarfieldTunnel.setState(STATE)

          break;

        case APP_STATES.GAME:
          // @ts-ignore
          space = await SpaceFactory.get(opts);

          this.currentSpace = space;

          this.add(space);

          Emitter.emit(Events.SPACE_CREATED, { space });

          this.currentSpace.visible = false;

          break;

        case APP_STATES.VOID:
          if (this.currentSpace) {
            this.remove(this.currentSpace);

            SpaceFactory.dispose(this.currentSpace);

            Emitter.emit(Events.SPACE_DISPOSED);

            Camera.current.reset();
          }

          this.currentSpace = null;

          break;
      }

      Promise.all(ps).then(async (res) => {
        if (STATE != APP_STATES.INTRO) {
          // StarfieldTunnel.setState(STATE)

          SET_SHADOW_NEEDS_UPDATE(true);
        }

        resolve(res);
      });
    });
  }

  getCurrentSpace() {
    //
    return SpaceFactory.current;
  }
}
