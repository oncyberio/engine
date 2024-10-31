// @ts-check

import { STATS, APP_STATES, SET_CURRENT_STATE, CANVAS } from "engine/constants";
import Renderer from "./renderer";
import Events from "engine/events/events";
import Emitter from "engine/events/emitter";
import Scene from "engine/scene";
import Camera from "engine/camera";
import RenderStats from "engine/utils/stats";
import SpaceFactory from "engine/space/index";
import PostProcessing from "engine/postprocessing";
import Root from "./root.js";
import { ShaderOverride } from "engine/xtend";
import Loader from "engine/loader";
import { SET_LIGHTING_STATE } from "engine/lightingstate";
import CSS3D from "./css3D/renderer";

export class World {
  constructor() {
    ShaderOverride();
  }

  start() {
    this.addEvents();

    this.root = new Root();

    Scene.add(this.root);

    Scene.visible = false;
  }

  async preload() {
    await this.root.preload();

    if (__BUILD_TARGET__ == "web") {
      await Loader.addKTX();
    }
  }

  showIntro() {
    return this.root.showIntro();
  }
  hideIntro() {
    return this.root.hideIntro();
  }

  /**
   * @type { import("./@types/states").SetStateFn }
   */
  async setState(STATE, opts) {
    var ps = [];

    switch (STATE) {
      case APP_STATES.INTRO:
      case APP_STATES.GAME:
      case APP_STATES.LOBBY:
      case APP_STATES.VOID:
        ps.push(this.root.setState(STATE, opts));

        break;
    }

    if (APP_STATES.INTRO != STATE) {
      Scene.visible = true;
    }

    return Promise.all(ps).then(async (res) => {
      await this.stateDone(STATE, opts);

      return res.flat();
    });
  }

  stateDone(STATE, opts, res) {
    return new Promise((resolve) => {
      var ps = [];

      if (__BUILD_TARGET__ != "web") {
        return resolve(ps);
      }

      if (SpaceFactory.current?.lighting?.active == true) {
        SET_LIGHTING_STATE(true);
      } else {
        SET_LIGHTING_STATE(false);
      }

      const previouslyVisible = Scene.visible;

      Scene.visible = true;

      Scene.visible = previouslyVisible;

      Promise.all(ps).then(() => {
        resolve(ps);
      });
    });
  }

  dawnupdate() {
    Renderer.info.reset();
  }

  update(delta) {
    if (
      globalThis.__THREE__ != "161devshadow4.0" &&
      this.threeWarning == null
    ) {
      console.error(globalThis.__THREE__, " re-install new three js ! ");
      this.threeWarning = true;
    }

    if (SpaceFactory.current != null && Scene.fog != SpaceFactory.current.fog) {
      Scene.fog = SpaceFactory.current.fog;
    }

    if (
      SpaceFactory.current != null &&
      Scene.environment != SpaceFactory.current.envMap
    ) {
      Scene.environment = SpaceFactory.current.envMap;
    }

    Renderer.clear(true, true, true);

    // @ts-ignore

    if (SpaceFactory.current?.lighting?.active == true) {
      SET_LIGHTING_STATE(true);

      SpaceFactory.current?.lighting.setRealTimeRender(true);
    } else {
      SET_LIGHTING_STATE(false);
    }

    CSS3D.active = true;

    CSS3D.update(Scene, Camera.current, {});

    PostProcessing.render(
      Scene,
      Camera.current,
      SpaceFactory?.current?.options,
      null,
      SpaceFactory.current?.lighting?.getCustomShadowMap()
    );
  }

  postupdate() {}

  duskupdate() {
    if (STATS) {
      RenderStats.update();
    }
  }

  addEvents() {
    if (__BUILD_TARGET__ != "web") return;

    this.postUpdateEvent = this.postupdate.bind(this);

    Emitter.on(Events.POST_UPDATE, this.postUpdateEvent);

    this.updateEvent = this.update.bind(this);

    Emitter.on(Events.UPDATE, this.updateEvent);

    this.dawnUpdateEvent = this.dawnupdate.bind(this);

    Emitter.on(Events.DAWN_UPDATE, this.dawnUpdateEvent);

    this.duskUpdateEvent = this.duskupdate.bind(this);

    Emitter.on(Events.DUSK_UPDATE, this.duskUpdateEvent);

    this.resizeEvent = this.resize.bind(this);

    Emitter.on(Events.RESIZE, this.resizeEvent);
  }

  resize(w, h) {
    Renderer.setSize(w, h);
  }

  getCurrentSpace() {
    return this.root.currentSpace;
  }
}
