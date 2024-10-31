

varying vec2 vUvBackground;

varying vec2 vUvInfo;

uniform float aspect;

#include <common>


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
        ),
        when_fgt(baseratio, asp)
    );
}

#include <fog_pars_vertex>


void main() {

    vUvBackground = correctRatio(uv, 1.0, aspect);

    vec3 transformed = position;

	vec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 );

	#include <worldpos_vertex>

	#include <fog_vertex>

	gl_Position = projectionMatrix * mvPosition;


}
