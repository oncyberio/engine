uniform float timer;
uniform float invaspect;
uniform vec2  invresolution;

varying vec2  vUv;

#define LOOP_RANGE_Y  50.0
#define LOOP_RANGE_XZ 50.0

float loopY(float y){
	return mod( y - timer * 20.0, LOOP_RANGE_Y ) - 2.5;
}

vec2 loopXZ(vec2 xz){

	vec2 res 	   =  xz * LOOP_RANGE_XZ;

	vec2 currentZ  =  cameraPosition.xz - res;

	return res + floor( currentZ / LOOP_RANGE_XZ ) * LOOP_RANGE_XZ + LOOP_RANGE_XZ * 0.5;

	return res;
}

attribute vec3 offset;

#define linewidth 1.0

varying float fogg;

#include <fog_pars_vertex>


#ifdef USE_FOG
	
	uniform float fogNear;

	uniform float fogFar;

#endif

void main() {

	vUv = 1.0 - uv;

	vec3 datOffset   	= vec3(offset);

	datOffset.y  	 	= loopY(datOffset.y) + cameraPosition.y;

	datOffset.xz     	= loopXZ(datOffset.xz);

	vec3 pp 			= vec3(0.0, position.y, 0.0);

	vec3 instanceStart  = datOffset + pp;

	float vWorldPosition      = distance( (modelMatrix * vec4(instanceStart, 1.0)).xz, cameraPosition.xz);

	vec3 instanceEnd    = instanceStart + vec3(0.0, 1.0, 0.0);

	vec4 start 	= modelViewMatrix * vec4( instanceStart, 1.0 );
	
	vec4 end 	= modelViewMatrix * vec4( instanceEnd, 1.0 );

	// clip space
	vec4 clipStart = projectionMatrix * start;
	vec4 clipEnd = projectionMatrix * end;

	// ndc space
	vec2 ndcStart = clipStart.xy / clipStart.w;
	vec2 ndcEnd = clipEnd.xy / clipEnd.w;

	// direction
	vec2 dir = ndcEnd - ndcStart;

	// account for clip-space aspect ratio
	dir.x /= invaspect;
	dir = normalize( dir );

	// perpendicular to dir
	vec2 offset = vec2( dir.y, dir.x );

	// undo invaspect ratio adjustment
	dir.x *= invaspect;
	offset.x *= invaspect;

	offset *= sign( position.x );

	#ifdef USE_FOG

		fogg = smoothstep( fogNear, fogFar, vWorldPosition );

	#else

		fogg = 1.0;

	#endif


	// fogg   = 0.5;
	
	offset *=  max( 0.25, linewidth * fogg);

	offset *= invresolution.y;

	// vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;
	vec4 clip = clipStart;

	offset *= clip.w;

	clip.xy += offset;

	gl_Position = clip;
	  
}   