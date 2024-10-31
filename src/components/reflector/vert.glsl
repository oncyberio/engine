uniform mat4 textureMatrix;
varying vec4 vUv;

#include <common>

#include <fog_pars_vertex>

uniform float tiles;

varying vec2 vPosition;

void main() {

	vPosition = (modelMatrix * vec4( position, 1.0)).xz * ( tiles );

	vUv = textureMatrix * vec4( position, 1.0 );

	vec3 transformed = position;

	vec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 );

	#include <worldpos_vertex>

	#include <fog_vertex>

	gl_Position = projectionMatrix * mvPosition;
}