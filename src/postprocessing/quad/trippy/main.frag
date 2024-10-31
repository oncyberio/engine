uniform float opacity;

uniform sampler2D tInput;

uniform float timer; 

uniform float speed;

varying vec2 vUv;

vec3 hue_shift(vec3 color, float dhue) {
	float s = sin(dhue);
	float c = cos(dhue);
	return (color * c) + (color * s) * mat3(
		vec3(0.167444, 0.329213, -0.496657),
		vec3(-0.327948, 0.035669, 0.292279),
		vec3(1.250268, -1.047561, -0.202707)
	) + dot(vec3(0.299, 0.587, 0.114), color) * (1.0 - c);
}

void main() {

	vec4 texel = texture2D( tInput, vUv );
	texel.rgb = hue_shift(texel.rgb, timer * 4.0 * speed + vUv.y * 3.0 );

  // texel.rgb * 1.2;
  
	gl_FragColor = texel;

	#include <colorspace_fragment>


}