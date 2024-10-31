import { MeshBasicMaterial } from "engine/xtend";

import PreVert from "./shaders/vert.pre.glsl";

import MainVert from "./shaders/vert.main.glsl";

import SuffVert from "./shaders/vert.suff.glsl";

import PreFrag from "./shaders/frag.pre.glsl";

import MainFrag from "./shaders/frag.main.glsl";

import SuffFrag from "./shaders/frag.suff.glsl";

function mergeDeep(target, source) {
    const isObject = (obj) => obj && typeof obj === "object";

    if (!isObject(target) || !isObject(source)) {
        return source;
    }

    Object.keys(source).forEach((key) => {
        const targetValue = target[key];
        const sourceValue = source[key];

        if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
            target[key] = targetValue.concat(sourceValue);
        } else if (isObject(targetValue) && isObject(sourceValue)) {
            target[key] = mergeDeep(
                Object.assign({}, targetValue),
                sourceValue,
            );
        } else {
            target[key] = sourceValue;
        }
    });

    return target;
}

export default class Basic extends MeshBasicMaterial {
    constructor(data = {}) {
        let opts = {};

        opts.defines = {};

        opts.vertexShaderHooks = {
            prefix: PreVert,

            main: MainVert,

            suffix: SuffVert,
        };

        opts.fragmentShaderHooks = {
            prefix: PreFrag,

            main: MainFrag,

            suffix: SuffFrag,
        };

        opts = mergeDeep(opts, data);

        super(opts);
    }
}
