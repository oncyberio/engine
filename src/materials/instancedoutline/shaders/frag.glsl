
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
	
	// vec4 diffuseColor = outlineColor;
	// THERE SAM

	vec3 diffuse = outlineColor;

	vec4 diffuseColor = vec4( diffuse, opacity );

	gl_FragColor = diffuseColor;

	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>

}