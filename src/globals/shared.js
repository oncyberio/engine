import Emitter from "engine/events/emitter";

import { Vector2 } from "three";

import {
  DEBUG,
  DPI,

  //RECORD_SIZE
} from "engine/constants";

import Events from "engine/events/events";

const BASE_TIME_ANIMATION = Math.floor(1666697916565 / 1000) % 500;

class Shared {
  constructor() {
    this.timer = {
      value: 0,
    };

    this.timer_d2 = {
      value: 0,
    };

    this.timer_x2 = {
      value: 0,
    };

    this.scanTimer = {
      value: 0,
    };

    this.aspect = {
      value: 0,
    };

    this.invaspect = {
      value: 0,
    };

    this.animationTimer = {
      value: BASE_TIME_ANIMATION,
    };

    this.dpi = {
      value: 1,
    };

    this.resolution = {
      value: new Vector2(1, 1),
    };

    this.invresolution = {
      value: new Vector2(1, 1),
    };

    this.record_size = {
      value: new Vector2(1, 1),
    };

    this.fog = {
      value: new Vector2(0, 49),
    };

    this.isDynamicRendering = {
      value: 0,
    };

    this.isScreenShotRendering = {
      value: 0,
    };

    if (DEBUG) {
      globalThis.shared = this;
    }

    this.addEvents();
  }

  update(delta) {
    // console.log( Date.now() / 1000  - BASE_TIME_ANIMATION )

    this.animationTimer.value += delta;

    this.timer.value += delta;

    this.timer_d2.value += delta * 0.5;

    this.timer_x2.value += delta * 2;

    this.scanTimer.value += delta;

    this.dpi.value = DPI;

    //this.record_size.value.set( RECORD_SIZE.w , RECORD_SIZE.h )
  }

  resize(w, h) {
    this.aspect.value = w / h;

    this.invaspect.value = 1 / (w / h);

    this.resolution.value.set(w, h);

    this.invresolution.value.set(1 / w, 1 / h);
  }

  addEvents() {
    Emitter.on(Events.UPDATE, this.update.bind(this));

    Emitter.on(Events.RESIZE, this.resize.bind(this));
  }
}

export default new Shared();
