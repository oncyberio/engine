export default /* glsl */`
#ifdef USE_FOG

    #ifdef FOG_EXP2

        float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );

    #else

        float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );

    #endif

    #ifdef USE_FOG_TEXTURE

        vec3 p = normalize(cameraPosition.xyz - vFogPosition.xyz);
    
        vec3 fogColor = fogTextureCubeUV( fogTexture, -p, 0.0 ).rgb;

        fogColor = linearToOutputTexel( vec4(fogColor, 1.0) ).rgb;

    #endif

    vec3 closeColor = gl_FragColor.rgb; // Your original fragment color
    vec3 midColor = fadeColor;// The mid color you want
    vec3 farColor = fogColor; // The far color is the fog color

    // Adjust the fogFactor ranges for each color step
    float midFogFactor = smoothstep(0.0, 0.8, fogFactor); // Adjust the range as needed
    
    // Blend between the three colors based on fogFactor
    vec3 blendedColor = mix(closeColor, midColor, midFogFactor);
    blendedColor = mix(blendedColor, farColor, fogFactor);

    gl_FragColor.rgb = blendedColor;

#endif
`;
