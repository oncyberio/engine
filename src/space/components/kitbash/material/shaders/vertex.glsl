attribute   vec3 offset;

attribute   float rotationY;

attribute   vec3 scale;

uniform     float timer;

attribute   vec4 rotation;

#ifndef OCCLUSION

    varying vec2 vUv;

    varying float height;

    varying float   vWorldPosition;

#endif

#pragma glslify: import('./transformPosition.glsl')

#include <fog_pars_vertex>



void main() {

    vec3 originalPosition = position;

    vec3 transformed       =   getPosition();

    #ifndef OCCLUSION

        vUv = uv;

        vWorldPosition  = transformed.y;

    #endif

    vec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 );

    #include <worldpos_vertex>

    #include <fog_vertex>

	gl_Position = projectionMatrix * mvPosition;
}
