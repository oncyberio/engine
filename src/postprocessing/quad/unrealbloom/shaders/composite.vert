varying vec2 vUv;

uniform float bloomRadius;

float lerpBloomFactor(float factor) { 
	float mirrorFactor = 1.2 - factor;
	return mix(factor, mirrorFactor, bloomRadius);
}

varying float V_BLOOM_FACTOR_0;
varying float V_BLOOM_FACTOR_1;
varying float V_BLOOM_FACTOR_2;
varying float V_BLOOM_FACTOR_3;
varying float V_BLOOM_FACTOR_4;

void main() {

	V_BLOOM_FACTOR_0 = lerpBloomFactor(BLOOM_FACTOR_0);

	V_BLOOM_FACTOR_1 = lerpBloomFactor(BLOOM_FACTOR_1);

	V_BLOOM_FACTOR_2 = lerpBloomFactor(BLOOM_FACTOR_2);

	V_BLOOM_FACTOR_3 = lerpBloomFactor(BLOOM_FACTOR_3);

	V_BLOOM_FACTOR_4 = lerpBloomFactor(BLOOM_FACTOR_4);

	vUv = vec2(0.5)+(position.xy)*0.5;
	
	gl_Position = vec4( position.xy, 0.0,  1.0 );
}