#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
uniform float opacity;
uniform float outlineThickness;
vec4 calculateOutline( vec4 pos, vec3 normal, vec4 skinned ) {
	float thickness = outlineThickness;
	const float ratio = 1.0; // TODO: support outline thickness ratio for each vert
	vec4 pos2 = projectionMatrix * modelViewMatrix * vec4( skinned.xyz + normal, 1.0 );
// NOTE: subtract pos2 from pos because BackSide objectNormal is negati
	vec4 norm = normalize( pos - pos2 );

	vec4 final = pos + norm * thickness * pos.w * ratio;
	final.z += 0.01; 

	return final; 
}
void main() {
	#include <uv_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	vec3 outlineNormal = - objectNormal; // the outline material is always rendered with BackSi
	gl_Position = calculateOutline( gl_Position, outlineNormal, vec4( transformed, 1.0 ) );
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

	#include <worldpos_vertex>
	#include <fog_vertex>
}
