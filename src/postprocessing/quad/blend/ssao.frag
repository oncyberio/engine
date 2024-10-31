varying vec2 vUv; 

// varying vec2 vUv2;

uniform sampler2D tInput;

uniform sampler2D tInput2;



vec4 addblend(const in vec4 x, const in vec4 y, const in float opacity) {

    return mix(x, x + y, opacity);

}

#define aoMapIntensity 1.0

void main() { 

    // vec4 base       = lookup(saturate(texture2D(tInput, vUv)), lut);
    // vec3 color       = (texture2D(tInput, vUv)).rgb;
    

    // vec4 temp       = (1.0 - ((1.0 - base) * (1.0 - blend)));


 
    vec3 color = texture2D( tInput, vUv ).rgb;

    float ambientOcclusion = ( texture2D( tInput2, vUv ).r - 1.0 ) * aoMapIntensity + 1.0;

    color = mix( vec3(0.5, 0.0, 0.0), color, ambientOcclusion );
    // vec3 lumcoeff = vec3( 0.299, 0.587, 0.114 );
    // float lum = dot( color.rgb, lumcoeff );
    // vec3 luminance = vec3( lum );

    // vec3 final =  color * ao;  // mix( color * ao, white, luminance )


    // float lumi   = czm_luminance(temp.rgb);

    // temp.rgb       +=  ((1.0 - lumi) * 0.08) * correctColor;

    // gl_FragColor = addblend( base, blend, 1.0);
    gl_FragColor = vec4(color, 1.0);

    #include <colorspace_fragment>


     // gl_FragColor = LinearTosRGB( gl_FragColor );

}
