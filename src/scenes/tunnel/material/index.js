 import {

	ShaderMaterial,

	UniformsLib,

	UniformsUtils,

	Color,

	Vector2,

	TangentSpaceNormalMap

} from 'three'


import lambVert   from './shaders/lambvert.glsl'

import lambFrag2 from './shaders/lambfrag2.glsl'

import Shared from 'engine/globals/shared'

export default class Material extends ShaderMaterial {

	constructor( options ){


 
		let opts = {

			vertexShader:  lambVert,

			fragmentShader: lambFrag2,

			uniforms: {

				timer: Shared.timer,

				desactivated: {

					value: 1
				},

				mouse : {

					value: new Vector2()
				}
			},

			defines: {
				
				LENGTH   : options.length + '.0',

				RATIO_POSITION : options.ratioPosition,

				SPEED : options.speed,

				RADIUS : options.radius + '.0'

			},


			transparent: true,

			lights: true,

			side: 1,

			// wireframe:true
		}
		
		opts.uniforms =  Object.assign(opts.uniforms, UniformsLib.lights)

		opts.uniforms = Object.assign( opts.uniforms,

			UniformsUtils.merge( [
					UniformsLib.common,
					UniformsLib.specularmap,
					UniformsLib.envmap,
					UniformsLib.aomap,
					UniformsLib.lightmap,
					UniformsLib.emissivemap,
					UniformsLib.bumpmap,
					UniformsLib.normalmap,
					UniformsLib.displacementmap,
					UniformsLib.lights,
					{
						emissive: { value: /*@__PURE__*/ new Color( 0x000000 ) }
					}
				] )
		)

		if( options.normalMap ) {

			opts.uniforms.normalMap.value = options.normalMap
			 
		}

		super(opts)

		if( options.normalMap ) {

			this.normalMap = opts.uniforms.normalMap.value

			this.normalMapType = TangentSpaceNormalMap;
			this.normalScale = new Vector2( 1, 1 );

		}

		this.isMeshLambertMaterial = true

		this.name = 'TunnelMaterial' 

		// console.log(this)

		// debugger;

	}

	update( m ){


		this.uniforms.mouse.value.copy( m )
	}



	clone(){

		return new ShaderMaterial(this.opts)
	}
}
