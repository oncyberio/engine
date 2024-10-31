import PreVert from "./shaders/vert.pree.glsl";
import MainVert from "./shaders/vert.main.glsl";
import SuffVert from "./shaders/vert.suff.glsl";

import PreFrag from "./shaders/frag.pre.glsl";
import MainFrag from "./shaders/frag.main.glsl";
// import SuffFrag from './shaders/frag.suff.glsl'

import { MeshBasicMaterial } from "engine/xtend";

export default class DiffuseMaterial extends MeshBasicMaterial {
    constructor(data) {
        let opts = {
            vertexShaderHooks: {
                prefix: PreVert,

                main: MainVert,

                suffix: SuffVert,
            },

            fragmentShaderHooks: {
                prefix: PreFrag,

                main: MainFrag,

                // suffix: SuffFrag
            },

            uniforms: {
                div: {
                    value: data.griddiv,
                },

                size: {
                    value: data.gridsize,
                },
            },

            shadowSide: 2,

            side: 2,

            fog: true,

            derivatives: true,
        };

        super(opts);

        this.color.set(data.color);

        this.name = "grid_shader_diffuse";

        this.uniforms = opts.uniforms;

        this.customProgramCacheKey = function () {
            return "grid_shader_diffuse";
        };
    }

    setRatio() {}
}
