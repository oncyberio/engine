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

attribute   vec3 offset;

attribute   float rotationY;

attribute   vec4 rotation;

attribute   vec3 scale;

#pragma glslify: import('../../common/transformposition.glsl')

#ifdef USE_INSTANCE_COLOR

    #define USE_COLOR 

    attribute vec3 icolor;

#endif


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

    vec3 position       =  getPosition();

    vec3 normal  	     = getNormal();

	vec4 mvPosition     = modelViewMatrix * vec4( position , 1.0 );

	gl_Position         = projectionMatrix * mvPosition;

    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  
	vec3 outlineNormal = - normal; // the outline material is always rendered with BackSi
	gl_Position = calculateOutline( gl_Position, outlineNormal, vec4( position, 1.0 ) );
	#include <fog_vertex>
}
