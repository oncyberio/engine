import { Assets } from "engine/assets";

export const presetImages = {
    grid: {
        id: "grid",
        name: "Grid",
        image: Assets.terrain.gridImg,
        path: Assets.terrain.grid,
        format: ".jpg",
    },
    wooden: {
        id: "wooden",
        name: "Wood",
        image: Assets.terrain.woodenImg,
        path: Assets.terrain.wooden,
        format: ".jpg",
    },
    rock: {
        id: "rock",
        name: "Rock",
        image: Assets.terrain.rockImg,
        path: Assets.terrain.rock,
        format: ".jpg",
    },
    grass: {
        id: "grass",
        name: "Grass",
        image: Assets.terrain.grassImg,
        path: Assets.terrain.grass,
        format: ".jpg",
    },
    sand: {
        id: "sand",
        name: "Sand",
        image: Assets.terrain.sandImg,
        path: Assets.terrain.sand,
        format: ".jpg",
    },
    snow: {
        id: "snow",
        name: "Snow",
        image: Assets.terrain.snowImg,
        path: Assets.terrain.snow,
        format: ".jpg",
    },
    rust: {
        id: "rust",
        name: "Rust",
        image: Assets.terrain.rustImg,
        path: Assets.terrain.rust,
        format: ".jpg",
    },
    marble: {
        id: "marble",
        name: "Marble",
        image: Assets.terrain.marbleImg,
        path: Assets.terrain.marble,
        format: ".jpg",
    },
    brick: {
        id: "brick",
        name: "Brick",
        image: Assets.terrain.brickImg,
        path: Assets.terrain.brick,
        format: ".jpg",
    },
    // custom: {
    //     id: "custom",
    //     name: "Custom",
    // },
};

export const textureOpts = Object.values(presetImages);

export const MODES = {
    texture: "texture",
    color: "color",
    shader: "shader",
} as const;

export const SHADERS = {
    grid: "grid",
    biplanar: "biplanar",
} as const;

export const TERRAIN_SHAPES = {
    plane: "plane",
    circle: "circle",
};
