 // 3, 5, 7, 9, 11

varying vec2 vUv;
uniform vec2 direction;
uniform vec2 invSize;
varying vec2 offsetMin[KERNEL_RADIUS];
varying vec2 offsetMax[KERNEL_RADIUS];


float gaussianPdf(in float x, in float sigma) {
	// return  exp(-x*x)/(2.0*sigma*sigma);
	return 0.39894 * exp( -0.5 * x * x/(sigma * sigma))/sigma;


}

varying float weightSum_0;

void main() {

	float fSigma 	= float(SIGMA);
	float weightSum = gaussianPdf(0.0, fSigma);

	weightSum_0 = weightSum;

	vUv = vec2(0.5)+(position.xy)*0.5;
	gl_Position = vec4( position.xy, 0.0,  1.0 );

	float x = 0.0;
	vec2 dd = vec2(0.0);

	x = 1.0;
	dd = direction * invSize * x;
	offsetMin[0] = vUv - dd;
	offsetMax[0] = vUv + dd;

	x = 2.0;
	dd = direction * invSize * x;
	offsetMin[1] = vUv - dd;
	offsetMax[1] = vUv + dd;

	x = 3.0;
	dd = direction * invSize * x;
	offsetMin[2] = vUv - dd;
	offsetMax[2] = vUv + dd;

	#ifdef KERNEL_RADIUS_5

		x = 4.0;
		dd = direction * invSize * x;
		offsetMin[3] = vUv - dd;
		offsetMax[3] = vUv + dd;

		x = 5.0;
		dd = direction * invSize * x;
		offsetMin[4] = vUv - dd;
		offsetMax[4] = vUv + dd;

	#endif

	#ifdef KERNEL_RADIUS_7

		x = 6.0;
		dd = direction * invSize * x;
		offsetMin[5] = vUv - dd;
		offsetMax[5] = vUv + dd;

		x = 7.0;
		dd = direction * invSize * x;
		offsetMin[6] = vUv - dd;
		offsetMax[6] = vUv + dd;

	#endif

	#ifdef KERNEL_RADIUS_9

		x = 8.0;
		dd = direction * invSize * x;
		offsetMin[7] = vUv - dd;
		offsetMax[7] = vUv + dd;

		x = 9.0;
		dd = direction * invSize * x;
		offsetMin[8] = vUv - dd;
		offsetMax[8] = vUv + dd;

	#endif

	#ifdef KERNEL_RADIUS_11

		x = 10.0;
		dd = direction * invSize * x;
		offsetMin[9] = vUv - dd;
		offsetMax[9] = vUv + dd;

		x = 11.0;
		dd = direction * invSize * x;
		offsetMin[10] = vUv - dd;
		offsetMax[10] = vUv + dd;

	#endif


}