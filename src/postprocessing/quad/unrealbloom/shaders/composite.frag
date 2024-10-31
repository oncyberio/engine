
varying vec2 vUv;
uniform sampler2D blurTexture1;
uniform sampler2D blurTexture2;
uniform sampler2D blurTexture3;
uniform sampler2D blurTexture4;
uniform sampler2D blurTexture5;


varying float V_BLOOM_FACTOR_0;
varying float V_BLOOM_FACTOR_1;
varying float V_BLOOM_FACTOR_2;
varying float V_BLOOM_FACTOR_3;
varying float V_BLOOM_FACTOR_4;

uniform float bloomStrength;

void main() {	

	vec4 total = 
		V_BLOOM_FACTOR_0 * texture2D(blurTexture1, vUv) + 
		V_BLOOM_FACTOR_1 * texture2D(blurTexture2, vUv) + 
	 	V_BLOOM_FACTOR_2 * texture2D(blurTexture3, vUv) + 
	 	V_BLOOM_FACTOR_3 * texture2D(blurTexture4, vUv) +
	 	V_BLOOM_FACTOR_4 * texture2D(blurTexture5, vUv) ;

	gl_FragColor = bloomStrength * total;
}