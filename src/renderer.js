// @ts-check

import { WebGLRenderer, PCFSoftShadowMap, SRGBColorSpace } from "three";
import { DPI, DEBUG, CANVAS } from "engine/constants";

/**
 * @type {WebGLRenderer}
 */
let renderer = null;

if (CANVAS != null) {
  renderer = new WebGLRenderer({
    canvas: CANVAS,
    antialias: true,
    alpha: false,
    stencil: false,
    powerPreference: "high-performance",
  });

  // We'll manage clearing manually because of the portals

  // custom flag

  // @ts-ignore
  renderer.renderRealTimeShadow = false;

  renderer.autoClear = false;

  renderer.setPixelRatio(DPI);

  renderer.outputColorSpace = SRGBColorSpace;

  renderer.info.autoReset = false;

  renderer.setClearColor(0x000000, 1);

  renderer.debug.checkShaderErrors =
    process.env.NODE_ENV == "development" || DEBUG;

  renderer.shadowMap.type = PCFSoftShadowMap;

  // renderer.shadowMap2.type = PCFSoftShadowMap

  renderer.shadowMap.autoUpdate = false;

  renderer.setTransparentSort((a, b) => {
    if (a.object._closestDistance != null) {
      a.z = a.object._closestDistance;
    }

    if (b.object._closestDistance != null) {
      b.z = b.object._closestDistance;
    }

    if (a.groupOrder !== b.groupOrder) {
      return a.groupOrder - b.groupOrder;
    } else if (a.renderOrder !== b.renderOrder) {
      return a.renderOrder - b.renderOrder;
    } else if (a.z !== b.z) {
      return b.z - a.z;
    } else {
      return a.id - b.id;
    }
  });

  renderer.setOpaqueSort((a, b) => {
    var aZ = a.z;

    var bZ = b.z;

    if (a.object._closestDistance != null) {
      aZ = a.object._closestDistance;
    }

    if (b.object._closestDistance != null) {
      bZ = b.object._closestDistance;
    }

    if (a.groupOrder !== b.groupOrder) {
      return a.groupOrder - b.groupOrder;
    } else if (a.renderOrder !== b.renderOrder) {
      return a.renderOrder - b.renderOrder;
    } else if (a.material.id !== b.material.id) {
      return a.material.id - b.material.id;
    } else if (aZ !== bZ) {
      return aZ - bZ;
    } else {
      return a.id - b.id;
    }
  });

  // renderer.realTimeShadowMap = new WebGLShadowMap(renderer, renderer.extensions, renderer.capabilities.maxTextureSize);

  if (DEBUG) {
    // @ts-ignore

    globalThis.renderer = renderer;
  }
}

export default renderer;
