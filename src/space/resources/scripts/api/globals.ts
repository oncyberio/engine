import {
  SET_SHADOW_NEEDS_UPDATE,
  IS_EDIT_MODE,
  IS_SERVER_MODE,
} from "engine/constants";

import { Device as _Device } from "engine/globals/device";

import { CANVAS as _CANVAS } from "engine/globals/canvas";

import * as Materials from "engine/materials";

import * as _THREE from "three";

// import _Controls from "engine/components/controls";

import PipeLineMesh from "engine/abstract/pipelinemesh.js";

/**
 * @public
 *
 * Returns a promise that resolves after a number of seconds has passed
 */
export function seconds(secs: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(null);
    }, secs * 1000);
  });
}

/**
 * @public
 */
// export const Controls = _Controls;

/**
 * @public
 */
export const Device = _Device;

/**
 * @public
 */
export const CANVAS = _CANVAS;

/**
 * @alpha
 */
export { Plugins } from "engine/libraries";

import * as Utils from "engine/utils/index.js";
import InstancedPipelineMesh from "engine/abstract/instancedpipelinemesh";
import InstancedBasic from "engine/materials/instancedbasic";
import InstancedStandard from "engine/materials/instancedstandard";
import InstancedShadow from "engine/materials/instancedshadow";
import InstancedGeometry from "engine/abstract/instancedgeometry";
import Shared from "engine/globals/shared";
import loader from "engine/loader";

export { Utils };

/**
 * @internal
 */
export const SHADOW_UPDATE_FLAG = SET_SHADOW_NEEDS_UPDATE;

/**
 * @internal
 */
// export const GRASS_FACTORY = GrassFactory;

/**
 * @internal
 */
export const PIPELINE_MESH = PipeLineMesh;

export const SHARED = Shared;

export { Materials };

/**
 * @public
 *
 * Object containing helpers for creating meshes and materials in accordance with the internal pipeline of the engine
 *
 */

export const OOOBjects = {
  PipeLineMesh,
  InstancedPipelineMesh,
  InstancedGeometry,
  InstancedBasicMaterial: InstancedBasic,
  InstancedStandardMaterial: InstancedStandard,
  InstancedDepthMaterial: InstancedShadow,
  Shared,
};

export * from "./scriptparams";

/**
 * Provides access to the current script execution environment
 */
export const Env = {
  /**
   * Returns true if the scripts is running in studio edit mode
   */
  get editMode() {
    //
    return IS_EDIT_MODE;
  },

  get isServer() {
    //
    return IS_SERVER_MODE;
  },
};

/**
 * @public
 */
export const ResourceLoader = {
  texture: (url: string) => loader.loadTexture(url),
  rawImage: (url: string) => loader.loadRawImage(url),
};
