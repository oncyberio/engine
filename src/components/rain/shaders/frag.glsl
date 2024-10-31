
varying float fogg;

varying vec2  vUv;

uniform float intensity;

void main() {

	gl_FragColor 	= vec4(1.0, 1.0, 1.0, 0.2 * vUv.y * fogg * intensity);

	#include <colorspace_fragment>
 
}