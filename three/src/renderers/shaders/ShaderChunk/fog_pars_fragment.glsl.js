export default /* glsl */`
#ifdef USE_FOG

	uniform vec3 fogColor;
	varying float vFogDepth;
	uniform vec3 fadeColor;

	#ifdef USE_FOG_TEXTURE

		#ifndef FOG_ENVMAP_TYPE_CUBE_UV

			#define FOG_ENVMAP_TYPE_CUBE_UV

			#include <fog_cube_uv_reflection_fragment>

		#endif

		uniform sampler2D fogTexture;

		varying vec3 vFogPosition;

		const vec2 invAtan = vec2(0.1591, 0.3183);
		vec2 SampleSphericalMap(vec3 direction)
		{
		    vec2 uv = vec2(atan(direction.z, -direction.x), asin(direction.y));
		    uv *= invAtan;
		    uv += 0.5;
		    return vec2(uv.x, 1.0 - uv.y);
		}

	#endif

	#ifdef FOG_EXP2

		uniform float fogDensity;

	#else

		uniform float fogNear;
		uniform float fogFar;

	#endif

#endif
`;
