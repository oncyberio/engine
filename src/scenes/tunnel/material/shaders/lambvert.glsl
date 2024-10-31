#define LAMBERT


varying vec3 vViewPosition;
varying vec3 vworldPosition;

varying vec2 vvUv;

uniform vec2 mouse;

varying vec3 vPosition;

varying vec2 initialUV;



#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

vec3 getPosition( vec2 uv ){

	vec2 vUv = uv;

	float angle = (2.0 * PI * vUv.x);

	float x =  RADIUS * cos(angle); // Calculate the X coordinate
	float y  = RADIUS * sin(angle); 

	vec3 pos = vec3(x, y, ( vUv.y ) * LENGTH);

	return  pos + vec3(mouse.x * 30.0, mouse.y * 30.0, 0.0) * smoothstep(LENGTH * 0.5, 0.0,  distance( ((LENGTH ) * ( 0.5)), pos.z  ) );

}

void main() { 

	initialUV = uv;

	vPosition = position;

	vec3 position = getPosition(uv);

	
	

	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>

	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

	vViewPosition = - mvPosition.xyz;

	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
	
	vvUv = vNormalMapUv;

	vworldPosition = mvPosition.xyz;


 

}


