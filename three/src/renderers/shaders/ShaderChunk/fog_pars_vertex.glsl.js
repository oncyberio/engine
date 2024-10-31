export default /* glsl */`
#ifdef USE_FOG

	varying float vFogDepth;

	#ifdef USE_FOG_TEXTURE

		varying vec3 vFogPosition;

	#endif

#endif
`;
