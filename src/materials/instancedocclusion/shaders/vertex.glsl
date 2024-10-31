attribute   vec3 offset;

attribute   float rotationY;

attribute   vec4 rotation;

attribute   vec3 scale;

#define INSTANCE

#pragma glslify: import('../../common/transformposition.glsl')

void main() {

    vec3 position       =  getPosition();

    vec3 normal  	     = getNormal();

	vec4 mvPosition     = modelViewMatrix * vec4( position , 1.0 );

	gl_Position         = projectionMatrix * mvPosition;

}