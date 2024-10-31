float when_fgt(float x, float y) {

	return max(sign(x - y), 0.0);
}

vec2 correctRatio(vec2 inUv, float baseratio, float asp){

	return mix(
		vec2(
			inUv.x, 
			inUv.y * baseratio / asp + .5 * ( 1. - baseratio / asp )
		),
		vec2(
			inUv.x * asp / baseratio + .5 * ( 1. - asp / baseratio),
			inUv.y
		)
		,when_fgt(baseratio, asp)
	);
}

varying vec2 vUv;

varying vec2 vUv2;

uniform float aspect;

void main() {

   vUv = vec2(0.5)+(position.xy)*0.5;

   vUv2 = correctRatio(vUv, 1.0, aspect);

   gl_Position = vec4( position.xy, 0.0,  1.0 );

}