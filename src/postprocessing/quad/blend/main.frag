varying vec2 vUv; 

uniform sampler2D tInput;

uniform sampler2D tInput2;

uniform float intensity;

uniform vec3 bloomColor;

void main() { 

    // vec4 base       = lookup(saturate(texture2D(tInput, vUv)), lut);


    vec4 base       = min( vec4( 1.0) ,(texture2D(tInput, vUv))) ;
    
    vec4 blend      = min( vec4(1.0), texture2D( tInput2, vUv ) * vec4(bloomColor, 1.0) * intensity * 5.0);

    vec4 temp       = (1.0 - ((1.0 - base) * (1.0 - blend)));

    // float lumi   = czm_luminance(temp.rgb);

    // temp.rgb       +=  ((1.0 - lumi) * 0.08);

    // gl_FragColor = addblend( base, blend, 1.0);
    gl_FragColor = min( vec4(1.0), temp);

    #include <colorspace_fragment>

    // gl_FragColor = blend;


     // gl_FragColor = LinearTosRGB( gl_FragColor );

}
