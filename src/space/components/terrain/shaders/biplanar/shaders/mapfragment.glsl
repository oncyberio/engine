#ifdef USE_MAP
	
	vec4 sampledDiffuseColor = vec4(1.0);


	vec3 wn = datNormal;

	// float fd = gl_FrontFacing ? 1.0 : - 1.0;
	// #ifdef DOUBLE_SIDED
	//     wn *= fd;
	// #endif


	// if( useTriplannar ) {


		// "p" point apply texture to
		// "n" normal at "p"
		// "k" controls the sharpness of the blending in the
		//     transitions areas.
		// "s" texture sampler
		// vec4 triplanar( in sampler2D s, in vec3 p, in vec3 n, in float k )

		// sampledDiffuseColor = triplanar( map, positionDomain * datWorldPosition, originalNormal,  edgeTransition);
		sampledDiffuseColor = biplanar(   datWorldPosition, wn, edgeTransition, vMapUv, wn );
		// sampledDiffuseColor = vec4( textureNoTile( map,   vMapUv, noTileDisplacement), 1.0);
		// sampledDiffuseColor = vec4(1.0, 1.0, 0.0, 1.0);
		// sampledDiffuseColor = vec4(wn.y, wn.y, wn.y, 1.0);

		// sampledDiffuseColor = vec4(vWorldPosition + 0.5, 1.0);
	// }
	// else {

	// 	sampledDiffuseColor = texture2D( map, vMapUv );
	// }
	
	// vec4 sampledDiffuseColor = vec4(1.0, 0.0, 0.0, 1.0);
	#ifdef DECODE_VIDEO_TEXTURE
		// inline sRGB decode (TODO: Remove this code when https://crbug.com/1256340 is solved)
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif
