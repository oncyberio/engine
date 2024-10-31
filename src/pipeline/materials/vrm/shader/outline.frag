
#include <common>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

varying vec4 localmvPosition;

vec3 fade(vec3 level, vec3 pos, float dist) {

    vec3 halfLevel = level * 0.5;

    return step(dist * 1.01, (abs(mod(pos, level) - halfLevel) / halfLevel));

}
void main() {

	#define level 0.016

	float dist = -localmvPosition.z;

	vec3 fades = vec3( 1.0 ) - fade( vec3(level), -localmvPosition.xyz, smoothstep(1.5, 2.0, dist) );
	
	if ( fades.x * fades.y * fades.z * vOpacity < 0.01) discard;

	gl_FragColor = vec4( 0.0, 0.0, 0.0, vOpacity );

	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}