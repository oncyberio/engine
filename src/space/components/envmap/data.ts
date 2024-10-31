import { Assets } from "engine/assets";

export const envmaps = {
    studio: {
        id: "studio",
        name: "Studio",
        image: Assets.envmap.studioImg,
        path: Assets.envmap.studio,
        format: ".hdr",
    },
    vig: {
        id: "vig",
        name: "Village",
        format: "hdr",
        image: Assets.envmap.vigImg,
        path: Assets.envmap.vig,
    },
    fields: {
        id: "fields",
        name: "Fields",
        image: Assets.envmap.fieldsImg,
        path: Assets.envmap.fields,
        format: ".hdr",
    },
    // custom: {
    //     id: "custom",
    //     name: "Custom",
    // },
};

export const envmapPresets = [
    {
        name: "Scene",
        image: "/components/envmap.png",
        data: {
            envmapType: "scene",
            sceneOpts: {
                position: { x: 0, y: 0, z: 0 },
            },
        },
    },
    {
        name: "Studio",
        image: envmaps.studio.image,
        data: {
            envmapType: "image",
            imageOpts: {
                image: envmaps.studio,
            },
        },
    },
    {
        name: "Fields",
        image: envmaps.fields.image,
        data: {
            envmapType: "image",
            imageOpts: {
                image: envmaps.fields,
            },
        },
    },
    {
        name: "Village",
        image: envmaps.vig.image,
        data: {
            envmapType: "image",
            imageOpts: {
                image: envmaps.vig,
            },
        },
    },
];
