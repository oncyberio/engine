
varying vec2 vUv;
uniform sampler2D colorTexture;

varying float weightSum_0;

varying vec2 offsetMin[KERNEL_RADIUS];
varying vec2 offsetMax[KERNEL_RADIUS];

float gaussianPdf(in float d, in float sigma) {

	float invSigmaQx2 = .5 / (sigma * sigma);

	return exp( -dot(d , d) * invSigmaQx2 ) * invSigmaQx2;
}
void main() {

	float fSigma 	= float(SIGMA);
	float weightSum = weightSum_0;
	vec3 diffuseSum = texture2D( colorTexture, vUv).rgb * weightSum;

	float x = 0.0;
	float w = 0.0;

	vec3 sample1 = vec3(0.0);
	vec3 sample2 = vec3(0.0);

	x = 1.0;
	w = gaussianPdf(x, fSigma);
	sample1 = texture2D( colorTexture, offsetMax[0]).rgb;
	sample2 = texture2D( colorTexture, offsetMin[0]).rgb;
	diffuseSum += (sample1 + sample2) * w;
	weightSum += 2.0 * w;

	x = 2.0;
	w = gaussianPdf(x, fSigma);
	sample1 = texture2D( colorTexture, offsetMax[1]).rgb;
	sample2 = texture2D( colorTexture, offsetMin[1]).rgb;
	diffuseSum += (sample1 + sample2) * w;
	weightSum += 2.0 * w;

	x = 3.0;
	w = gaussianPdf(x, fSigma);
	sample1 = texture2D( colorTexture, offsetMax[2]).rgb;
	sample2 = texture2D( colorTexture, offsetMin[2]).rgb;
	diffuseSum += (sample1 + sample2) * w;
	weightSum += 2.0 * w;

	#ifdef KERNEL_RADIUS_5

		x = 4.0;
		w = gaussianPdf(x, fSigma);
		sample1 = texture2D( colorTexture, offsetMax[3]).rgb;
		sample2 = texture2D( colorTexture, offsetMin[3]).rgb;
		diffuseSum += (sample1 + sample2) * w;
		weightSum += 2.0 * w;

		x = 5.0;
		w = gaussianPdf(x, fSigma);
		sample1 = texture2D( colorTexture, offsetMax[4]).rgb;
		sample2 = texture2D( colorTexture, offsetMin[4]).rgb;
		diffuseSum += (sample1 + sample2) * w;
		weightSum += 2.0 * w;

	#endif

	#ifdef KERNEL_RADIUS_7

		x = 6.0;
		w = gaussianPdf(x, fSigma);
		sample1 = texture2D( colorTexture, offsetMax[5]).rgb;
		sample2 = texture2D( colorTexture, offsetMin[5]).rgb;
		diffuseSum += (sample1 + sample2) * w;
		weightSum += 2.0 * w;

		x = 7.0;
		w = gaussianPdf(x, fSigma);
		sample1 = texture2D( colorTexture, offsetMax[6]).rgb;
		sample2 = texture2D( colorTexture, offsetMin[6]).rgb;
		diffuseSum += (sample1 + sample2) * w;
		weightSum += 2.0 * w;

	#endif

	#ifdef KERNEL_RADIUS_9

		x = 8.0;
		w = gaussianPdf(x, fSigma);
		sample1 = texture2D( colorTexture, offsetMax[7]).rgb;
		sample2 = texture2D( colorTexture, offsetMin[7]).rgb;
		diffuseSum += (sample1 + sample2) * w;
		weightSum += 2.0 * w;

		x = 9.0;
		w = gaussianPdf(x, fSigma);
		sample1 = texture2D( colorTexture, offsetMax[8]).rgb;
		sample2 = texture2D( colorTexture, offsetMin[8]).rgb;
		diffuseSum += (sample1 + sample2) * w;
		weightSum += 2.0 * w;

	#endif

	#ifdef KERNEL_RADIUS_11

		x = 10.0;
		w = gaussianPdf(x, fSigma);
		sample1 = texture2D( colorTexture, offsetMax[9]).rgb;
		sample2 = texture2D( colorTexture, offsetMin[9]).rgb;
		diffuseSum += (sample1 + sample2) * w;
		weightSum += 2.0 * w;

		x = 11.0;
		w = gaussianPdf(x, fSigma);
		sample1 = texture2D( colorTexture, offsetMax[10]).rgb;
		sample2 = texture2D( colorTexture, offsetMin[10]).rgb;
		diffuseSum += (sample1 + sample2) * w;
		weightSum += 2.0 * w;

	#endif


	gl_FragColor = vec4(diffuseSum/weightSum, 1.0);
}