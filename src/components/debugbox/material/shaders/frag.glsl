uniform vec3 color;

uniform float opacity;

void main() {

	vec4 final     =  vec4(color, opacity);

	gl_FragColor = final;
}