uniform sampler2D map;

// uniform sampler2D tinfo;

uniform float timer;

uniform float dpi;

varying vec4 worldPosition;

varying vec3 worldNormal;

uniform float rotation;

varying vec2 vUv;

varying float vAngle;

uniform float loading;

uniform float depthFade;

uniform float inverseDepth;

// uniform float isDynamicRendering;

varying float loaderTimer;

#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>





// vec4 SRGBToLinear( in vec4 value ) {

//    return vec4(mix(  pow((value.rgb + 0.055) * 1.055, vec3(2.4)), vec3(value.rgb / 12.92), vec3( lessThanEqual( value.rgb, vec3(0.04045) ) ) ), value.a);

// }
// vec4 SRGBToLinear(vec4 sRGB)
// {
// 	bvec4 cutoff = lessThan(sRGB, vec4(0.04045));
// 	vec4 higher = pow((sRGB + vec4(0.055))/vec4(1.055), vec4(2.4));
// 	vec4 lower = sRGB/vec4(12.92);

// 	return mix(higher, lower, cutoff);
// }

const float SRGB_INVERSE_GAMMA = 2.2;

vec3 SRGBToLinear(vec3 srgb) {
    return pow(srgb, vec3(SRGB_INVERSE_GAMMA));
}



mat3 getRotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;

    return mat3(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c);
}

float frand(vec2 o)
{
    vec2 p = o * 256.0;
    vec3 p3  = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}


float noise(vec2 p){
	vec2 ip = floor(p);
	vec2 u = fract(p);
	u = u*u*(3.0-2.0*u);

	float res = mix(
		mix(frand(ip),frand(ip+vec2(1.0,0.0)),u.x),
		mix(frand(ip+vec2(0.0,1.0)),frand(ip+vec2(1.0,1.0)),u.x),u.y);
	return res*res;
}


// based on https://www.shadertoy.com/view/MslGR8
vec3 dithering( vec3 color ) {
	//Calculate grid position
	float grid_position = frand( gl_FragCoord.xy );

	//Shift the individual colors differently, thus making it even harder to see the dithering pattern
	vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );

	//modify shift according to grid position.
	dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );

	//shift the color by dither_shift
	return color + dither_shift_RGB * 75.0 * dpi;
}

float dithering( float color ) {
	//Calculate grid position
	float grid_position = frand( gl_FragCoord.xy + timer );

	//Shift the individual colors differently, thus making it even harder to see the dithering pattern
	float dither_shift_RGB =  0.25 / 255.0  ;

	//modify shift according to grid position.
	dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );

	//shift the color by dither_shift
	return color + dither_shift_RGB * 75.0;
}


float hash(float p) { p = fract(p * 0.011); p *= p + 7.5; p *= p + p; return fract(p); }
float hash(vec2 p) {vec3 p3 = fract(vec3(p.xyx) * 0.13); p3 += dot(p3, p3.yzx + 3.333); return fract((p3.x + p3.y) * p3.z); }

float newnoise(vec2 x) {
    vec2 i = floor(x);
    vec2 f = fract(x);

	// Four corners in 2D of a tile
	float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    // Simple 2D lerp using smoothstep envelope between the values.
	// return vec3(mix(mix(a, b, smoothstep(0.0, 1.0, f.x)),
	//			mix(c, d, smoothstep(0.0, 1.0, f.x)),
	//			smoothstep(0.0, 1.0, f.y)));

	// Same code, with the clamps in smoothstep and common subexpressions
	// optimized away.
    vec2 u = f * f * (3.0 - 2.0 * f);
	return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}




void main() {

	float faceDirection = gl_FrontFacing ? 1.0 : 0.0;

	vec3 cameraToVertex = mix( normalize( cameraPosition.xyz - worldPosition.xyz ) , normalize( worldPosition.xyz - cameraPosition ) , faceDirection );


	vec2 sXsY = mix(vec2(0.0), (vUv - 0.5 * 2.0), inverseDepth ) ;

	float aa = smoothstep( 0.8, 1.4, distance(vec2(0.0), (vUv - 0.5) * 2.0) );

	vec2 uvDomain = mix(vUv, vUv * 0.5, depthFade );

	float datnoise = ( dithering(newnoise(vUv * 5.0 - vec2(timer, (vUv.y + timer * 0.2)  )) - 0.5))  * 2.0 * 0.4;

	vec3 perturbNormal = dithering(vec3( newnoise(uvDomain * 80.0 - timer) - 0.5 ,newnoise(uvDomain * 40.0 + 50.0 ) - 0.5, newnoise(uvDomain * 20.0 - 100.0 ) - 0.5  )  ) ;

	float perturbRatio = mix( 0.02 , 0.05, depthFade ) * 0.25 + loading * 0.025;

	perturbNormal.rgb *= perturbRatio;

	// perturb normals
	// vec3 worldNormal =  worldNormal + (vec3( vec2(aa  * 0.085) * sXsY, 0.0) + perturbNormal.rgb ) ;
	vec3 worldNormal =  worldNormal;

	vec3 vWorldDirection = reflect( cameraToVertex, worldNormal );

	float inverse = gl_FrontFacing ? -1.0 : 1.0;

	vWorldDirection.x *= inverse;

	// mat3 rotationMatrix = getRotationMatrix(vec3(0.0, 1.0, 0.0),vAngle  + rotation +sin(timer * 0.2) * 0.1);
	mat3 rotationMatrix = getRotationMatrix(vec3(0.0, 1.0, 0.0), vAngle +  rotation  );

	vWorldDirection = rotationMatrix * normalize(vWorldDirection);

	vec2 uv = equirectUv(vWorldDirection);

	uv.y = gl_FrontFacing ? uv.y : 1.0 - uv.y;

    // vec4 infoColor       = LinearTosRGB(texture2D(tinfo, vUv + perturbNormal.xy * (smoothstep(0.3, 1.0, loading))));

    vec4 finalColor 		 = texture2D(map, uv);

    #ifdef HALO_COLOR

    	finalColor.rgb = mix(

    		// finalColor.rgb ,1.3 *  texture2D(map, vec2(0.5, 0.5)).rgb ,
    		finalColor.rgb ,  finalColor.rgb * 0.25 ,
    		// finalColor.rgb , finalColor.rgb * 0.35 ,

    		min(max(0.0,  (1.0- vUv.y ) * (aa  + datnoise * aa) * 0.8)  ,

    		1.0)
    	);

    #endif


    finalColor.rgb *= mix(0.75, 1.0, vUv.y);

    float inUv =  1.0 -  smoothstep(0.4, 1.0, distance(loaderTimer, vUv.x + vUv.y + worldNormal.x + worldNormal.y)  );

    finalColor.rgb = mix( finalColor.rgb , finalColor.rgb * 1.8 + 0.4 , loading * 0.3 * inUv);

    // finalColor         = mix(finalColor, infoColor, infoColor.a * (1.0 - loading));

	finalColor *= max(getShadowMask(), 0.5);


    gl_FragColor = finalColor;



	#include <colorspace_fragment>

    #include <fog_fragment>



    // if(isDynamicRendering == 1.0){

    // 	gl_FragColor.rgb = SRGBToLinear(gl_FragColor.rgb);	
    // }

    // gl_FragColor = vec4(vUv.y,vUv.y, vUv.y, 1.0 );


}
