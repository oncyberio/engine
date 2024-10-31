// @ts-check
import conf from "engine/utils/params";

import { UAParser } from "engine/utils/uaparser";

import offscreenWebglTest from "engine/utils/offscreenwebgltest.js";

import { deferred } from "engine/utils/deferred";

import { Assets } from "engine/assets";

export const FRONT_END = typeof window !== "undefined";

const uaParser = FRONT_END ? UAParser(navigator.userAgent) : null;

var isSafari = false;
var isFirefox = false;
var firefoxVersion = 0;

if (FRONT_END) {
  //
  if (process.env.NODE_ENV === "development") {
    //
    globalThis["$uaParser"] = uaParser;
  }

  const browser = uaParser.browser;

  isSafari = browser?.name === "Safari";

  isFirefox = browser?.name === "Firefox";

  firefoxVersion = isFirefox ? parseInt(browser?.major ?? 0) : -1;
}

export const OS = FRONT_END ? uaParser.os : null;

const deviceType = FRONT_END ? uaParser.device.type : null;

export var IS_DESKTOP = deviceType != "tablet" && deviceType != "mobile";

export var IS_MOBILE = IS_DESKTOP != true;

export const IS_MAC = FRONT_END ? uaParser.os?.name === "Mac OS" : false;

export const IS_TOUCH = IS_MOBILE;

export let CANVAS = null;

if (__BUILD_TARGET__ === "web" && FRONT_END) {
  CANVAS = document.createElement("canvas");

  CANVAS.style.width = "100%";

  CANVAS.style.height = "100%";

  CANVAS.style.outline = "none";

  CANVAS.style.position = "absolute";
  CANVAS.style.left = 0;
  CANVAS.style.top = 0;

  CANVAS.style.maxWidth = "100%";
  CANVAS.style.maxHeight = "100%";

  CANVAS.id = "game-canvas";
}

export const FPS = Number(conf.fps);

export const IS_POINTER_LOCK = () =>
  FRONT_END ? document.pointerLockElement === CANVAS : null;

export const DEBUG = conf.debug;

export const DEBUG_PHYSICS = conf.debugphysics;

export const DEBUG_COLLISION = conf.debugCollision;

export const DEBUG_BOX = conf.debugbox;

export const FBO_DEBUG = conf.debugfbo;

export const STATS = conf.stats;

export var DPI = FRONT_END ? Math.min(window.devicePixelRatio, 2) : null;
// export var DPI = FRONT_END ? 1 : null;

export var REAL_DPI = DPI;

export var SET_REAL_DPI = function (val) {
  REAL_DPI = val;
};

export var QUALITIES = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

// export var QUALITY = IS_MOBILE ? QUALITIES.LOW : QUALITIES.HIGH;
export var QUALITY = QUALITIES.HIGH;

export const WEB_WORKER_SUPPORT =
  typeof Worker !== "undefined" && __BUILD_TARGET__ === "web";

export const WEBWORK_DELAY = conf.webworkdelay ? conf.webworkdelay : false;

export const DEBUG_WEBWORK = conf.webwork == true;

var canvasTest = FRONT_END ? document.createElement("canvas") : null;

export var SUPPORT_OFFSCREEN_CANVAS = canvasTest
  ? typeof canvasTest.transferControlToOffscreen === "function"
  : false;

canvasTest = null;

export var SUPPORT_OFFSCREEN_CANVAS_WEBGL = offscreenWebglTest(
  SUPPORT_OFFSCREEN_CANVAS,
  WEB_WORKER_SUPPORT
);

export var BITMAP_SUPPORT =
  typeof createImageBitmap !== "undefined" &&
  !isSafari &&
  !(isFirefox && firefoxVersion < 98);

export var GPU_TIER = {};

export var SET_GPU_TIER = function (val) {
  console.log("GPU TIER : ", val);
  GPU_TIER = val;
};

export var COMPRESSED_SUPPORT = false;

export var SET_COMPRESSED_SUPPORT = function (values) {
  var support = false;

  for (const property in values) {
    support = support || values[property];
  }

  COMPRESSED_SUPPORT = support;

  console.log("COMPRESSED_SUPPORT", COMPRESSED_SUPPORT);
};

export const LANDSCAPE = "landscape";

export const PORTRAIT = "portrait";

export var ORIENTATION = null;

export var SET_ORIENTATION = function (val) {
  ORIENTATION = val;
};

export var CSS_CANVAS = null;

export function SET_CSS_CANVAS(val) {
  CSS_CANVAS = val;
}
export var CSS_FACTOR = 60;

export var VIEW = {
  w: 0,
  h: 0,
};

export var REAL_VIEW = {
  w: 0,
  h: 0,
};

export var SET_VIEW = (w, h) => {
  VIEW.w = w;
  VIEW.h = h;
};

export var SET_REAL_VIEW = (w, h) => {
  REAL_VIEW.w = w;
  REAL_VIEW.h = h;
};

export var IS_VR_SUPPORTED = null;

export const SET_VR_SUPPORTED = (val) => {
  IS_VR_SUPPORTED = val;
};

export var IS_VR = false;

export const SET_VR = (val) => {
  IS_VR = val;
};

export var SHADOW_NEEDS_UPDATE = false;

export function SET_SHADOW_NEEDS_UPDATE(val) {
  SHADOW_NEEDS_UPDATE = val;
}

if (FRONT_END) {
  // @ts-ignore
  window.SET_SHADOW_NEEDS_UPDATE = SET_SHADOW_NEEDS_UPDATE;
}

const MFER_AVATAR_PICTURE = Assets.images.mferAvatarPic;

export var DEFAULT_PLAYER_AVATAR_PICTURE = MFER_AVATAR_PICTURE;

const SUNSHINE_VRM = Assets.vrms.sunshine;

export var DEFAULT_AVATAR_VRM = SUNSHINE_VRM;

export const LOD_VRM_DISTANCE = 150;

export const LOD_VRM_VISIBILITY = 300;

export const LOD_VRM = Assets.vrms.lod;

export const FPS_BAKING = 60;

export const MAX_INSTANCES = 200;

export const MINIMUM_VRM_BOX = 1.0;

export const MAXIMUM_VRM_BOX = 2.7;

export const MINIMUM_MIX_RATIO = (1 * MINIMUM_VRM_BOX) / MAXIMUM_VRM_BOX;

export const GLOBAL_TEXT_SCALE = 0.02 * 0.4;

export var FONT_DISTANCE_RANGE_FIELD = 0;

export var SET_FONT_DISTANCE_RANGE_FIELD = function (val) {
  FONT_DISTANCE_RANGE_FIELD = val;
};

export const CAMERA_LAYERS = {
  DYNAMIC: 1,
  EDITOR: 2,
};

export var APP_STATES = /*@__PURE__*/ Object.freeze({
  //
  VOID: "VOID",

  IDLE: "IDLE",

  INTRO: "INTRO",

  GAME: "GAME",

  LOBBY: "LOBBY",
});

/**
 * @type { import("./@types/states").AppState }
 */
export var PREVIOUS_STATE = null;

/**
 * @type { import("./@types/states").AppState }
 */
export var CURRENT_STATE = APP_STATES.VOID;

/**
 *
 * @param { import("./@types/states").AppState } STATE
 */
export function SET_CURRENT_STATE(STATE) {
  PREVIOUS_STATE = CURRENT_STATE;

  CURRENT_STATE = STATE;
}

let userInteraction = deferred();

export const USER_INTERACTED = userInteraction.promise;

export const SET_USER_INTERACTED = (val) => {
  console.trace("SET_USER_INTERACTED", val);
  userInteraction.resolve(true);
};

{
  if (FRONT_END) {
    const handleUserInteraction = () => {
      SET_USER_INTERACTED(true);
    };

    const opts = { once: true, capture: true };

    window.addEventListener("touchend", handleUserInteraction, opts);

    window.addEventListener("click", handleUserInteraction, opts);
  }
}

export let IS_EDIT_MODE = false;

export const SET_EDIT_MODE = (val) => {
  //
  IS_EDIT_MODE = val;
};

export let IS_SERVER_MODE = __BUILD_TARGET__ != "web";
