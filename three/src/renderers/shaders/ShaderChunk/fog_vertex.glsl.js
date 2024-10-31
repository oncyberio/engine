export default /* glsl */`
#ifdef USE_FOG

	vFogDepth = - mvPosition.z;

	#ifdef USE_FOG_TEXTURE

		vFogPosition = worldPosition.xyz;

	#endif

#endif
`;
