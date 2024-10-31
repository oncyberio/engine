// @ts-check

import { Assets } from "engine/assets";

export const POST_TYPES = {
  BLOOM: "Bloom",

  SELECTIVE_BLOOM: "SelectiveBloom",

  LOOK_UP_TABLE: "LookUpTable",

  CYBERCITY: "CyberCity",

  SSAO: "SSAO",

  TRIPPY: "Trippy",

  TV: "TV",
};

export const LUTMAPS = {
  hudson: {
    id: "hudson",
    name: "hudson",
    image: Assets.lutmaps.hudsonImg,
    path: Assets.lutmaps.hudson,
  },

  kodak: {
    id: "kodak",
    name: "kodak",
    image: Assets.lutmaps.kodakImg,
    path: Assets.lutmaps.kodak,
  },

  sunset: {
    id: "sunset",
    name: "sunset",
    image: Assets.lutmaps.sunsetImg,
    path: Assets.lutmaps.sunset,
  },
  custom: {
    id: "custom",
    name: "custom",
  },
};

export const POST_PROCESSINGS = {
  Bloom: {
    name: POST_TYPES.BLOOM,

    values: {
      threshold: 0.23,

      smoothing: 0.59,

      intensity: 1,

      radius: 0.7,
    },
  },

  LookUpTable: {
    name: POST_TYPES.LOOK_UP_TABLE,

    values: {
      image: LUTMAPS.hudson,
    },
  },

  CyberCity: {
    name: POST_TYPES.CYBERCITY,

    values: {
      correctColor: 0.13,

      intensity: 1,

      radius: 0.87,
    },
  },

  SSAO: {
    name: POST_TYPES.SSAO,

    values: {
      intensity: 0.5,
    },
  },
};
