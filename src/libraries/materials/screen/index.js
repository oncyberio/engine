
import { ShaderMaterial,SRGBColorSpace, UniformsLib }     from "three"

import VertexShader           from "./shaders/vertex.glsl"

import FragmentShader         from "./shaders/fragment.glsl"

import HoloVertexShader       from "./shaders/holovertex.glsl"

import HoloFragmentShader     from "./shaders/holofragment.glsl"

import Shared                 from 'engine/globals/shared.js'


export default class FutureMaterial extends ShaderMaterial {

    constructor(block, op) {

        const name = block.name


        let opts = {
           
            vertexShader: VertexShader,

            fragmentShader: FragmentShader,

            uniforms: {},

            transparent: false,

            side: 2,

            fog: true,

            defines: []

        }  

        opts.uniforms =  Object.assign(opts.uniforms, UniformsLib.fog)

        const lower = name.toLowerCase()

        // console.log(lower)

        if ( block.material.map != null ){

            opts.uniforms.map = { value: block.material.map }

            opts.uniforms.map.value.needsUpdate = true

            opts.uniforms.map.value.generateMipmaps = true

            opts.uniforms.map.value.colorSpace = SRGBColorSpace


        	opts.defines['USE_MAP'] = ''
        }

        if( lower.includes('screen') ) {

            opts.vertexShader       = HoloVertexShader

            opts.fragmentShader     = HoloFragmentShader

            opts.transparent = true

        	opts.defines['SCREEN'] = ''


            var texture_ratio = 1;

            if(opts.uniforms.map.value.source.data){

                texture_ratio = opts.uniforms.map.value.source.data.width / opts.uniforms.map.value.source.data.height

            }


            opts.uniforms.texture_ratio = { value: texture_ratio }

            opts.uniforms.timer = Shared.timer_d2

            // timer             : Shared.timer,

            // fog             : Shared.fog
        }

        if( block.material.alphaTest < 1 ) {

            opts.defines['ALPHA_TEST'] = ''

            opts.uniforms.alphaTest = { value : block.material.alphaTest }
        }

        if( lower.includes('rotate') ) {

            opts.defines['ROTATING'] = ''
        }


        opts.defines['INSTANCE'] = ''
        
        super(opts)

        this.occlusionMaterial    = new ShaderMaterial(opts)

        this.mirrorMaterial       = new ShaderMaterial(opts)

        // console.log(this)
    }

    get map(){

        return this.uniforms.map.value
    }

    set map( val ){

        this.uniforms.map.value = val
    }
}
