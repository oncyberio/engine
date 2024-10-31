import { MeshBasicMaterial, MeshLambertMaterial } from "engine/xtend";

import PreVert from "./shaders/vert.pre.glsl";

import MainVert from "./shaders/vert.main.glsl";

import SuffVert from "./shaders/vert.suff.glsl";

import PreFrag from "./shaders/frag.pre.glsl";

import MainFrag from "./shaders/frag.main.glsl";

import SuffFrag from "./shaders/frag.suff.glsl";

import Shared from 'engine/globals/shared'

export class GlitchBasic extends MeshBasicMaterial {
    
    constructor(data = {}) {
        
        let opts = data;

        if (opts.defines == null) {
            opts.defines = {}
        }

        if(opts.uniforms == null){

            opts.uniforms = {}
        }

        opts.uniforms.timer = Shared.timer
        opts.uniforms.texture_ratio = 1.0

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

        if( data.plugins && data.plugins.length ){

            opts.plugins = data.plugins;
        }

        super(opts);
    }
}


export class GlitchLambert extends MeshLambertMaterial {
    
    constructor(data = {}) {
        
        let opts = data;

        if (opts.defines == null) {
            opts.defines = {}
        }
        if(opts.uniforms == null){

            opts.uniforms = {}
        }

        opts.uniforms.timer = Shared.timer
        opts.uniforms.texture_ratio = 1.0

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

        if( data.plugins && data.plugins.length ){

            opts.plugins = data.plugins;
        }

        super(opts);
    }
}