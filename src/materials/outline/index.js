import {

    Color,

    UniformsLib

} from 'three'

import VertexShader  from './shaders/vert.glsl'

import FragmentShader from './shaders/frag.glsl'


import { ShaderMaterial } from "engine/xtend";


const defaultUniforms = {

    outlineThickness: { value:  0.0025 },
    outlineColor: { value:  new Color(0, 0, 0) },
    outlineAlpha: { value: 1.0 },
    opacity: { value: 1.0 }
}

export default class OutlineMaterial extends ShaderMaterial {
    
    constructor(data = {}) {
        
        let opts = data;

        if (opts.defines == null) {
            opts.defines = {}
        }

        if(opts.uniforms == null){

            opts.uniforms = defaultUniforms
        }
        else {

            opts.uniforms = Object.assign(defaultUniforms, opts.uniforms)
        }

        opts.uniforms = Object.assign(opts.uniforms, UniformsLib.fog)

        opts.uniforms = Object.assign(opts.uniforms, UniformsLib.displacementmap)
        
        opts.vertexShader = VertexShader

        opts.fragmentShader = FragmentShader

        if( data.plugins && data.plugins.length ){

            opts.plugins = data.plugins;
        }

        opts.transparent = true

        opts.side = 1

        opts.fog = true

        super(opts);

        // set a dynamic setter for opacity after the material has been created
        // cant be before since opacity is used internally in threejs on material creation

        Object.defineProperty(this, 'opacity', {
            get: function () {
                return this.uniforms.opacity.value;
            },
            set: function (val) {
                this.uniforms.opacity.value = val;
            },
        });
    }

    
}
