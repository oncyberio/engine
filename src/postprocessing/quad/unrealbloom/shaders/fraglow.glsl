#include <common>
varying vec2 vUv;
uniform sampler2D colorTexture;
uniform vec2 texSize;
uniform vec2 direction;
uniform vec2 invSize;

float gaussianPdf(in float d, in float sigma) {

	float invSigmaQx2 = .5 / (sigma * sigma);
	return exp( -dot(d , d) * invSigmaQx2 ) * invSigmaQx2;
}

void main() {
	
	float fSigma = float(SIGMA);
	float weightSum = gaussianPdf(0.0, fSigma);
	vec3 diffuseSum = texture2D( colorTexture, vUv).rgb * weightSum;
	for( int i = 1; i < KERNEL_RADIUS; i ++ ) {
		float x = float(i);
		float w = gaussianPdf(x, fSigma);
		vec2 uvOffset = direction * invSize * x;
		vec3 sample1 = texture2D( colorTexture, vUv + uvOffset).rgb;
		vec3 sample2 = texture2D( colorTexture, vUv - uvOffset).rgb;
		diffuseSum += (sample1 + sample2) * w;
		weightSum += 2.0 * w;
	}
	gl_FragColor = vec4(diffuseSum/weightSum, 1.0);
}