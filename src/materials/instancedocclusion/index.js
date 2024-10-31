import { ShaderMaterial } from "engine/xtend";

import VertexShader from "./shaders/vertex.glsl";

import FragmentShader from "./shaders/frag.glsl";

export default class InstancedOcclusion extends ShaderMaterial {

    constructor(data = {}) {

        let opts = Object.assign({},data)

        opts.defines = {};

        opts.defines["INSTANCE"] = "";

        for (const prop in data.defines) {
            opts.defines[prop] = data.defines[prop];
        }

        opts.vertexShader = VertexShader;

        opts.fragmentShader = FragmentShader;

        opts.plugins = data.plugins;

        // debugger;

        super(opts);

    }
}
