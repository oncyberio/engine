import {
  WebGLRenderTarget,
  LinearFilter,
  SRGBColorSpace,
  FloatType,
  HalfFloatType,
  DepthFormat,
  UnsignedShortType,
  Vector3,
  Color,
} from "three";

import Renderer from "engine/renderer";

import { FBO_DEBUG, DPI } from "engine/constants";

import Quad from "./quad";

import Emitter from "engine/events/emitter";

import FBOHelper from "engine/globals/fbohelper";

import Events from "engine/events/events";

import Shared from "engine/globals/shared";

import { POST_TYPES } from "./constants";

let temp = new Color();

class PostProcessing {
  constructor() {
    this.settings = {
      minFilter: LinearFilter,

      magFilter: LinearFilter,

      type: HalfFloatType,

      // stencilBuffer: true,
      stencilBuffer: false,

      colorSpace: SRGBColorSpace,

      // depthBuffer: true,

      generateMipmaps: false,
    };

    if (__BUILD_TARGET__ === "web") {
      this.target = new WebGLRenderTarget(1, 1, this.settings);

      // this.target.depthTexture = new DepthTexture()

      // this.target.depthTexture.format = DepthFormat

      // this.target.depthTexture.needsUpdate = true

      this.occlusion = new WebGLRenderTarget(1, 1, this.settings);

      if (FBO_DEBUG) {
        FBOHelper.attach(this.target, "color");

        FBOHelper.attach(this.occlusion, "occlusion");
      }

      this.quad = new Quad();

      this.addEvents();

      this.oldClearColor = new Color();

      this.resize(window.innerWidth, window.innerHeight);

      this.previousLightingRenderSetting = null;
    }

    this.options = {
      enabled: false,
      type: null,
    };

    globalThis.setupLights = true;
  }

  render(scene, camera, options, target, shadows = []) {
    if (Renderer.info.render.manualFrame != null) {
      // @ts-ignore
      Renderer.info.render.manualFrame++;
    }

    Emitter.emit(Events.PRE_RENDER, scene, camera);

    let oldRenderTarget = Renderer.getRenderTarget();

    if (
      this.options.enabled == true &&
      (this.options.value.amount != null ? this.options.value.amount > 0 : true)
    ) {
      Shared.isDynamicRendering.value = 0.0;

      const type = this.options.type;

      let oldAutoClear = Renderer.autoClear;

      Renderer.getClearColor(temp);

      Renderer.autoClear = false;

      // diffuse

      Renderer.setRenderTarget(this.target);

      Renderer.clear(true, true, false);

      Renderer.render(scene, camera, shadows);

      if (
        type == POST_TYPES.BLOOM ||
        type == POST_TYPES.CYBERCITY ||
        (type == "custom" && this.options?.value?.useOcclusion == true)
      ) {
        this.renderOcclusionTarget(scene, camera);
      }

      Renderer.sortObjects = false;

      this.quad.render(this.target, this.occlusion, this.options, target);

      Renderer.sortObjects = true;

      if (oldRenderTarget != Renderer.getRenderTarget()) {
        Renderer.setRenderTarget(oldRenderTarget);
      }

      Renderer.autoClear = oldAutoClear;
    } else {
      if (target != null) {
        Renderer.setRenderTarget(target);
      }

      // Renderer.clear();

      Renderer.render(scene, camera, shadows);

      if (target != null) {
        Renderer.setRenderTarget(oldRenderTarget);
      }
    }
  }

  renderOcclusionTarget(scene, camera) {
    // let oldRenderTarget = Renderer.getRenderTarget()

    Renderer.getClearColor(this.oldClearColor);

    Renderer.setClearColor(0x000000, 1);

    Renderer.setRenderTarget(this.occlusion);

    Renderer.clear(true, true, false);

    Emitter.emit(Events.OCCLUSION, true);

    let oldAutoUpdate = scene.matrixWorldAutoUpdate;

    let oldCameraAutoUpdate = camera.matrixWorldAutoUpdate;

    scene.matrixWorldAutoUpdate = false;

    camera.matrixWorldAutoUpdate = false;

    let oldResolution = {
      x: Shared.resolution.value.x,

      y: Shared.resolution.value.y,
    };

    Shared.resize(oldResolution.x * 0.5, oldResolution.y * 0.5);

    Renderer.render(scene, camera, [], true, false);

    scene.matrixWorldAutoUpdate = oldAutoUpdate;

    camera.matrixWorldAutoUpdate = oldCameraAutoUpdate;

    Emitter.emit(Events.OCCLUSION, false);

    Renderer.setClearColor(this.oldClearColor, 1);

    Shared.resize(oldResolution.x, oldResolution.y);
  }

  resize(w, h, forceDPI = null) {
    this.width = w;

    this.height = h;

    const calcDPI = forceDPI == null ? DPI : forceDPI;

    this.target.setSize(Math.floor(w * calcDPI), Math.floor(h * calcDPI));

    this.occlusion.setSize(
      Math.floor(w * calcDPI * 0.5),
      Math.floor(h * calcDPI * 0.5)
    );

    // console.log( this.quad )

    this.quad.resize(w * 0.5, h * 0.5, calcDPI);
  }

  addEvents() {
    Emitter.on(Events.RESIZE, this.resize.bind(this));
  }
}

export default new PostProcessing();
