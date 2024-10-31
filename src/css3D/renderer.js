// @ts-check

import { Scene } from "three";

import Camera from "engine/camera";

import Emitter from "engine/events/emitter";

import Events from "engine/events/events";

import {
  CANVAS,
  CSS_FACTOR,
  VIEW,
  REAL_VIEW,
  SET_CSS_CANVAS,
} from "engine/constants";

import { CSS3DRenderer, CSS3DObject } from "./css3Drenderer";

class CSS3D {
  constructor() {
    if (__BUILD_TARGET__ != "web") return;

    this.renderer = new CSS3DRenderer();

    this.renderer.domElement.id = "CSS";

    this.renderer.domElement.style.position = "absolute";

    this.renderer.domElement.style.width = "100%";

    this.renderer.domElement.style.height = "100%";

    this.renderer.domElement.style.top = "0";

    // this.renderer.domElement.style.pointerEvents = "none";

    this.renderer.domElement.style.backgroundColor = "black";

    this.renderer.domElement.style.zIndex = "0";

    this.scene = new Scene();

    this.camera = null;

    this.cssFactor = CSS_FACTOR;
  }

  updateCSSCameraNearFar(camera) {
    this.camera.far = camera.far * this.cssFactor;
    // this.camera.far = camera.far

    this.camera.near = camera.near * this.cssFactor;
    // this.camera.near = camera.near

    this.camera.updateProjectionMatrix();
  }

  update(scene, camera, roomParams) {
    if (!this.active) return;

    if (this.scene.children.length > 0) {
      if (this.camera == null) {
        this.camera = camera.clone();

        this.resize();

        this.updateCSSCameraNearFar(camera);
      }

      if (CSS_FACTOR !== this.cssFactor) {
        this.cssFactor = CSS_FACTOR;

        this.updateCSSCameraNearFar(camera);
      }

      this.camera.position
        .copy(Camera.current.position)
        .multiplyScalar(this.cssFactor);

      this.camera.quaternion.copy(Camera.current.quaternion);

      this.scene.fog = scene.fog;

      this.renderer.render(this.scene, this.camera, this.cssFactor);
    }
  }

  set active(val) {
    if (__BUILD_TARGET__ != "web") return;

    if (val === this._active) return;

    this._active = val;

    if (CANVAS.parentElement) {
      if (val) {
        SET_CSS_CANVAS(this.renderer.domElement);

        CANVAS.parentElement.insertBefore(this.renderer.domElement, CANVAS);

        this.addEvents();

        this.resize();
      } else if (this.renderer.domElement.parentElement) {
        SET_CSS_CANVAS(null);

        this.renderer.domElement.parentElement.removeChild(
          this.renderer.domElement
        );

        this.removeEvents();
      }
    }
  }

  get active() {
    return this._active;
  }

  resize() {
    this.renderer.setSize(REAL_VIEW.w, REAL_VIEW.h, false);

    if (this.camera) {
      this.camera.aspect = REAL_VIEW.w / REAL_VIEW.h;

      this.camera.updateProjectionMatrix();
    }
  }

  addEvents() {
    if (this.resizeEvent == null) {
      this.resizeEvent = this.resize.bind(this);

      Emitter.on(Events.RESIZE, this.resizeEvent);

      this.resize();
    }
  }

  removeEvents() {
    if (this.resizeEvent) {
      Emitter.off(Events.RESIZE, this.resizeEvent);

      this.resizeEvent = null;
    }
  }

  add(el) {
    this.scene.add(el);
  }

  remove(el) {
    this.scene.remove(el);
  }
}

export default new CSS3D();
