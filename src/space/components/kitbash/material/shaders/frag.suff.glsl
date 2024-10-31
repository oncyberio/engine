#ifdef OCCLUSION

	#ifdef USE_FOG

		float f = smoothstep( fogNear, fogFar, vFogDepth );

		gl_FragColor.rgb *= (1.0 - f);

	#endif

#endif