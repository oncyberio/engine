#include <common>
#include <packing>

uniform float alpha;

uniform sampler2D map;

varying vec2 vUv;

varying vec3 vColor;

varying float vOpacity;




#ifdef DEPTH

	varying vec2 vHighPrecisionZW;

#else

	#include <fog_pars_fragment>

#endif

const vec2 msdfunit = vec2( msdfUnit_X, msdfUnit_Y );


float screenPxRange() {
    vec2 unitRange = msdfunit;
    vec2 screenTexSize = vec2(1.0)/fwidth(vUv);
    return max(0.5*dot(unitRange, screenTexSize), 1.0);
}
	
float median(float r, float g, float b) {
    return max(min(r, g), min(max(r, g), b));
}

void main() {


	//gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
	//return;
	vec3 map = texture2D(map, vUv).rgb;

    float sd = median(map.r, map.g, map.b);

	float screenPxDistance = screenPxRange()*(sd - 0.5);
    float fAlpha = clamp(screenPxDistance + 0.5, 0.0, 1.0);

	

	// #else

	// 	float fAlpha = clamp(sigDist/fwidth(sigDist) + 0.5, 0.0, 1.0);

	// #endif

	if (fAlpha < alphaTest) discard;

	#ifdef INSTANCED 

		fAlpha *= vOpacity;


	#else	

		fAlpha *= alpha;


	#endif

	vec4 final     =  vec4(vColor, fAlpha);

	gl_FragColor = final;

	// deal with floating point artefact on render targets with float type

	gl_FragColor.rgb = min(vec3(1.0), gl_FragColor.rgb);

	#ifdef OCCLUSION 

		gl_FragColor.rgb = vec3(0.0);
		
	#else

		#ifdef DEPTH

		   float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;

			gl_FragColor = packDepthToRGBA( fragCoordZ );

		#else

			#include <colorspace_fragment>

			#include <fog_fragment>

		#endif

		

	#endif
	

}


// #include <common>
// #include <packing>

// varying vec2 vHighPrecisionZW;

// void main() {

//     float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;

//     #if (DEPTH_PACKING == 3200)

//     	gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), 1.0 );

//     #elif DEPTH_PACKING == 3201

//     	gl_FragColor = packDepthToRGBA( fragCoordZ );

//     #endif
// }
