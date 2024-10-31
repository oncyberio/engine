uniform vec3 color;
uniform sampler2D tDiffuse;
uniform float opacity;
uniform float useNormalMap;
uniform float normalStrength;
varying vec4 vUv;

varying vec2 vPosition;

uniform sampler2D normalMap;

float blendOverlay( float base, float blend ) {

	return( base < 0.5 ? ( 2.0 * base * blend ) : ( 1.0 - 2.0 * ( 1.0 - base ) * ( 1.0 - blend ) ) );

}

vec3 blendOverlay( vec3 base, vec3 blend ) {

	return vec3( blendOverlay( base.r, blend.r ), blendOverlay( base.g, blend.g ), blendOverlay( base.b, blend.b ) );
}

#include <fog_pars_fragment>

#include <common>

void main() {

	vec3 coord = vUv.xyz / vUv.w;

	vec2 normal_uv = vec2(coord.xy);

	float needsNormal = useNormalMap * normalStrength;

	if ( needsNormal > 0.0 ) {

		vec2 nmUv 		= mod( vPosition, vec2(1.0) );

		vec3 nn 		= texture2D(normalMap, nmUv).xyz;

		vec3 my_normal = normalize( vec3( nn.r * 2.0 - 1.0, nn.b,  nn.g * 2.0 - 1.0 ) );

		normal_uv = coord.xy + coord.z * my_normal.xz * normalStrength * 0.2;

	}

	gl_FragColor        = texture2D( tDiffuse, normal_uv );

	gl_FragColor = vec4( blendOverlay( gl_FragColor.rgb, color ), opacity );

	#include <colorspace_fragment>

	#include <fog_fragment>

}