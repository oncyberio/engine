import { VIEW } from "engine/constants";

export const FOV = 65;

export const NEAR = 0.5;

export const FAR = 3000;

export const MIN_FOV = 65;

export const MAX_FOV = 90;

var FOV_RATIO_RESIZE = 1;

import Mix from "engine/utils/math/mix";

import Smoothstep from "engine/utils/math/smoothstep";

export const GET_RATIO_FOV = () => {
  FOV_RATIO_RESIZE = Smoothstep(0.5, 1.0, VIEW.w / VIEW.h);

  return Mix(MAX_FOV, MIN_FOV, FOV_RATIO_RESIZE);
};
