uniform sampler2D 	map;

uniform float 		timer;

varying float 		nShiftPower;

varying float 		vScanSize;

uniform float 		texture_ratio;

varying vec2 vUv;

varying vec2 vPosUv;


#define GRID_SIZE 50.0

vec3 when_gt(vec3 x, vec3 y) {
  return max(sign(x - y), 0.0);
}

float when_gt(float x, float y) {
  return max(sign(x - y), 0.0);
}

vec3 rgbShift(vec2 uv){


	float timer = timer;

	float d1 = nShiftPower * 0.001;
	float d2 = nShiftPower * 0.002;

	vec2 q   = uv * texture_ratio;

	lowp vec3 col;	

	float x =  nShiftPower * sin(0.3*timer+q.y*21.0)*sin(0.7*timer+q.y*29.0)*sin(0.3+0.33*timer+q.y*31.0)*0.0017;

	col.r = texture2D(map,vec2(x + uv.x+ d1 ,uv.y+ d1)).x+0.05;
	col.g = texture2D(map,vec2(x + uv.x  ,uv.y- d2)).y+0.05;
	col.b = texture2D(map,vec2(x + uv.x- d2 ,uv.y    )).z+0.05;

	float nshiftQuater = nShiftPower * 0.75;
	
	col.r += 0.08*texture2D(map,nshiftQuater*vec2(x+0.025, -0.027)+ nShiftPower * vec2(uv.x+0.001,uv.y+0.001)).x;
	col.g += 0.05*texture2D(map,nshiftQuater*vec2(x-0.022, -0.02) + nShiftPower * vec2(uv.x+0.000,uv.y-0.002)).y;
	col.b += 0.08*texture2D(map,nshiftQuater*vec2(x-0.02, -0.018) + nShiftPower * vec2(uv.x-0.002,uv.y+0.000)).z;

		
	return col;
}

float scan(vec2 uv){

	vec2 q = uv * texture_ratio;

	float tt = 0.35+0.35*sin(3.5 * timer * 5.0 + vPosUv.y * GRID_SIZE );

	return  max(when_gt(tt, 0.1), 0.6);
}

vec3 grid(vec2 uv){

	float scanSize = vScanSize * GRID_SIZE;

	return when_gt(

		1.0-0.65*vec3(clamp((mod(vPosUv.x * scanSize , 2.0)-1.0)*2.0,0.0,1.0))

	, vec3(0.5));
	
}

#include <fog_pars_fragment>

void main() {


	lowp vec4 final;

	if(nShiftPower > 0.0){

		final = vec4(rgbShift(vUv), 1.0);

	}

	else {
		
		final = texture2D(map, vUv);
	}

	gl_FragColor = final;

	gl_FragColor.rgb 	   *= scan(vUv);

	// #ifndef OCCLUSION

		#ifndef MIRROR 

			#ifndef NO_GRID

				gl_FragColor.rgb 		*= grid(vUv * texture_ratio);

			#endif

		#endif

	// #endif

	#ifndef D3


	#endif

	gl_FragColor.a 		*=  min(gl_FragColor.r + gl_FragColor.g + gl_FragColor.b, 1.0);

	if( gl_FragColor.a < 0.1 ) {

		discard;
	}
	
	// final.rgb 	= mix( vec3(1.0), final.rgb , fogg);


  	#ifdef USE_FOG

  		#ifdef FOG_EXP2

  			float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );

  		#else

  			float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );

  		#endif

  		#ifndef OCCLUSION

	  		#ifdef USE_FOG_TEXTURE

	  			vec3 p = normalize(cameraPosition.xyz - vFogPosition.xyz);
	  		
	  			vec3 fogColor = fogTextureCubeUV( fogTexture, -p, 0.0 ).rgb;

	  			fogColor = linearToOutputTexel( vec4(fogColor, 1.0) ).rgb;

	  		#endif

  		#endif

  		gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );


  	#endif


  	#ifdef USE_FOG

  		#ifndef INSTANCE

  			fogFactor = 1.0;

  		#endif

  	#else 

  		float fogFactor = 1.0;

  	#endif


	// vec4 occlusion 	= final;

	#ifdef OCCLUSION 


		gl_FragColor.rgb 	= mix( gl_FragColor.rgb,  gl_FragColor.rgb * vec3(vUv, 1.0), 0.9 ) * max( 1.0 - fogFactor, 0.6) ;


	#else

		#ifdef MIRROR 

			gl_FragColor.rgb 	= mix( gl_FragColor.rgb,  gl_FragColor.rgb * vec3(vUv, 1.0), 0.9 ) * max( 1.0 - fogFactor, 0.6) * 1.2;

		#endif

	#endif


	#include <colorspace_fragment>



}
