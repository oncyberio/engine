varying vec2 vUv;

#include <common>

varying vec3 vWorldDirection;

varying vec4 worldPosition;

varying vec3 worldNormal;

varying float depth;

varying float vAngle;

uniform float loading;

varying float depthFade;

varying float inverseDepth;

varying float loaderTimer;

uniform float timer;

uniform float scaleFactor;

#include <fog_pars_vertex>

#include <shadowmap_pars_vertex>


 
void main(){

	vUv = uv;

	loaderTimer =  mod( timer * 6.0, 5.0 ) - 2.5;

	depth = smoothstep(3.0 * scaleFactor, 10.0 * scaleFactor,  distance(cameraPosition.xyz, modelMatrix[3].xyz) );

	depthFade =mix( depth, 1.0, loading);

	inverseDepth =mix( 1.0 - depth, 1.0, loading);

	float scaleVal = mix(1.0, 5.0, depth);

	worldPosition = modelMatrix * vec4(  position * scaleVal , 1.0);

	vWorldDirection = transformDirection(position * scaleVal, modelMatrix);

	vec3 transformedNormal = normal;

	transformedNormal = normalMatrix * transformedNormal;

	//worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );

	worldNormal = normal;

	vec3 vertDir = worldPosition.xyz - cameraPosition.xyz;

	// vViewDir

	// vViewDir = -vec3(modelViewMatrix * vec4(pos, 1.0));

	vec3 n = mat3(modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz) * vec3(0.0, 0.0, 1.0);

	vAngle = dot(cross(n, vec3(0.0, 1.0, 0.0)), normalize(-vertDir));

	vec3 transformed = position;

	vec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 );

	#include <worldpos_vertex>

	#include <shadowmap_vertex>
	
	#include <fog_vertex>

	gl_Position = projectionMatrix * mvPosition;

}