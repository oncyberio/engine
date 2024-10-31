attribute   vec3 offset;

attribute   vec3 scale;

#ifndef ROTATING

    uniform     float timer;

#endif
attribute   vec4 rotation;

varying 	vec2 vUv;

varying 	float vWorldPosition;

varying 	float vScanSize;

varying 	float nShiftPower;

#define rgb_shift_power 6.0

float rand(float n){return fract(sin(n) * 43758.5453123);}

vec3 when_gt(vec3 x, vec3 y) {
  return max(sign(x - y), 0.0);
}

float when_gt(float x, float y) {
  return max(sign(x - y), 0.0);
}

#define max_flat 8.0

varying vec2 vPosUv;


#pragma glslify: import('../../../../materials/common/transformposition.glsl')


#include <fog_pars_vertex>


void main() {

	vUv = uv;


	vec3 transformed    =  getPosition();

	vec3 tempPosition  	=   (modelMatrix * vec4(transformed, 1.0)).xyz;

	vPosUv 				= 	vec2( tempPosition.x + tempPosition.z, tempPosition.y );

	vWorldPosition  	= 	distance( (modelMatrix * vec4(position, 1.0)).xz, cameraPosition.xz);


	float midZ 			=  -(modelViewMatrix * vec4(offset.xyz, 1.0)).z;


	vScanSize 			= 	smoothstep( max_flat, max_flat - 0.001, midZ);

	float mdlMidZ   	=   (modelMatrix * vec4(offset.xyz, 1.0)).z;


	nShiftPower 		= 	mix( rgb_shift_power, 0.0, when_gt(0.965, rand( floor( mdlMidZ + timer * 10.0)) ));

    #ifndef INSTANCE

        nShiftPower = 0.0;

    #endif

    vec4 mvPosition = modelViewMatrix * vec4( transformed , 1.0 );

    #include <worldpos_vertex>

    #include <fog_vertex>

	gl_Position = projectionMatrix * mvPosition;

	vWorldPosition  = distance( (modelMatrix * vec4(position, 1.0)).xz, cameraPosition.xz);
}
