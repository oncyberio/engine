// @ts-check

import { Assets } from "engine/assets";

export const POST_TYPES = {
    BLOOM: "Bloom",

    SELECTIVE_BLOOM: "SelectiveBloom",

    LOOK_UP_TABLE: "LookUpTable",

    TRIPPY: "Trippy",

    TV: "TV",

    // CYBERCITY: "CyberCity",
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
};

export const POST_PROCESSINGS = {
    Bloom: {
        name: POST_TYPES.BLOOM,

        opts: {
            threshold: 0.75,

            smoothing: 0.29,

            intensity: 0.6,

            radius: 0.7,

            color: "#ffffff",
        },
    },

    LookUpTable: {
        name: POST_TYPES.LOOK_UP_TABLE,

        opts: {
            image: LUTMAPS.hudson,
        },
    },

    // CyberCity: {
    //     name: POST_TYPES.CYBERCITY,

    //     opts: {
    //         correctColor: 0.13,

    //         intensity: 1,

    //         radius: 0.87,
    //     },
    // },

    Trippy: {
        name: POST_TYPES.TRIPPY,

        opts: {
            speed: 0.1,
        },
    },

    TV: {

        name: POST_TYPES.TV,

        opts: {

            amount: 1.0,
            strength: 1.0,
            glitchRatio: 0.2,
            speed: 1.0,
            vignetteFallOff: 0,
            vignetteStrength: 1,
            
        }
    }
};
