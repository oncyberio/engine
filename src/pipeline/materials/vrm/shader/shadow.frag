#include <common>
#include <packing>

varying vec2 vHighPrecisionZW;

void main() {

    float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;

    #if (DEPTH_PACKING == 3200)

    	gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), 1.0 );

    #elif DEPTH_PACKING == 3201

    	gl_FragColor = packDepthToRGBA( fragCoordZ );

    #endif
}
