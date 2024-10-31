
#include <common>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

uniform vec3 outlineColor;
uniform float outlineAlpha;
uniform float opacity;

void main() {

	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>

	float opa = outlineAlpha * opacity;
	if( opa < 0.001 ){
		discard;
	}

	gl_FragColor = vec4( outlineColor, opa);

	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>

}