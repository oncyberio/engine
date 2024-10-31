import { MeshBasicMaterial } from "engine/xtend";

import PreVert from "./shaders/vert.pre.glsl";

import MainVert from "./shaders/vert.main.glsl";

import SuffVert from "./shaders/vert.suff.glsl";

import PreFrag from "./shaders/frag.pre.glsl";

import MainFrag from "./shaders/frag.main.glsl";

import SuffFrag from "./shaders/frag.suff.glsl";

import Shared   from 'engine/globals/shared.js'

import Basic from "engine/materials/basic";

import Lambert from "engine/materials/lambert";

export class InstancedGlitchBasic extends Basic {
    constructor(data = {}) {

        let opts = Object.assign({},data)

        if (opts.defines == null) {
            opts.defines = {};
        }

        if(opts.uniforms == null){

            opts.uniforms = {}
        }

        opts.uniforms.timer = Shared.timer
        opts.uniforms.texture_ratio = 1.0

        opts.defines["INSTANCE"] = "";


        opts.vertexShaderHooks = {
            prefix: data?.vertexShaderHooks?.prefix
                ? data.vertexShaderHooks?.prefix
                : PreVert,

            main: data?.vertexShaderHooks?.main
                ? data.vertexShaderHooks?.main
                : MainVert,

            suffix: data?.vertexShaderHooks?.suffix
                ? data.vertexShaderHooks?.suffix
                : SuffVert,
        };

        opts.fragmentShaderHooks = {
            prefix: data?.fragmentShaderHooks?.prefix
                ? data.fragmentShaderHooks?.prefix
                : PreFrag,

            main: data?.fragmentShaderHooks?.main
                ? data.fragmentShaderHooks?.main
                : MainFrag,

            suffix: data?.fragmentShaderHooks?.suffix
                ? data.fragmentShaderHooks?.suffix
                : SuffFrag,
        };


        if( data.plugins && data.plugins.length > 0 ){

            opts.plugins = data.plugins;
        }

        opts.transparent = true 

        opts.shadowSide = 2

        opts.side = 2

        opts.fog = true

        super(opts)

    }
}

export class InstancedGlitchLambert extends Lambert {
    constructor(data = {}) {

        let opts = Object.assign({},data)

        if (opts.defines == null) {
            opts.defines = {};
        }

        if(opts.uniforms == null){

            opts.uniforms = {}
        }

        opts.uniforms.timer = Shared.timer
        opts.uniforms.texture_ratio = 1.0

        opts.defines["INSTANCE"] = "";


        opts.vertexShaderHooks = {
            prefix: data?.vertexShaderHooks?.prefix
                ? data.vertexShaderHooks?.prefix
                : PreVert,

            main: data?.vertexShaderHooks?.main
                ? data.vertexShaderHooks?.main
                : MainVert,

            suffix: data?.vertexShaderHooks?.suffix
                ? data.vertexShaderHooks?.suffix
                : SuffVert,
        };

        opts.fragmentShaderHooks = {
            prefix: data?.fragmentShaderHooks?.prefix
                ? data.fragmentShaderHooks?.prefix
                : PreFrag,

            main: data?.fragmentShaderHooks?.main
                ? data.fragmentShaderHooks?.main
                : MainFrag,

            suffix: data?.fragmentShaderHooks?.suffix
                ? data.fragmentShaderHooks?.suffix
                : SuffFrag,
        };


        if( data.plugins && data.plugins.length > 0 ){

            opts.plugins = data.plugins;
        }

        opts.transparent = true 

        opts.shadowSide = 2

        opts.side = 2

        opts.fog = true

        super(opts)

    }
}