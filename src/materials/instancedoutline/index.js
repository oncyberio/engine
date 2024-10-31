import {

    Color,

    UniformsLib

} from 'three'

import VertexShader  from './shaders/vert.glsl'

import FragmentShader from './shaders/frag.glsl'

import { ShaderMaterial } from "engine/xtend";



export default class InstancedOutlineMaterial extends ShaderMaterial {
    
    constructor(data = {}) {
        
        let opts = data;

        if (opts.defines == null) {
            opts.defines = {}
        }

        opts.defines["INSTANCE"] = "";

        const uniforms =  opts.uniforms = {

            outlineThickness: { value:  0.0025  },
            outlineColor: { value:  new Color(0, 0, 0) },
            outlineAlpha: { value: 1.0 },
            opacity: { value: 1.0 }
        }
       
       
        opts.uniforms = Object.assign(uniforms, opts.uniforms)

        opts.uniforms = Object.assign(opts.uniforms, UniformsLib.fog)

        opts.uniforms = Object.assign(opts.uniforms, UniformsLib.displacementmap)
        
        opts.vertexShader = VertexShader

        opts.fragmentShader = FragmentShader

        if( data.plugins && data.plugins.length ){

            opts.plugins = data.plugins;
        }

        opts.side = 1

        opts.transparent = true

        // opts.fog = true

        super(opts);
    }
}
