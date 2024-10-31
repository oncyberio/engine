// gl_FragColor.rgb = mix(gl_FragColor.rgb , vec3(1.0), 0.5);

float rimPower = 1.0;

float f = rimPower * abs( dot( ghostVnormal, normalize( ghostvEye ) ) );
f =  ( 1. - smoothstep( 0.0, 1., f ) );

gl_FragColor.rgb += vec3( f * gl_FragColor.rgb);

gl_FragColor.a = max(f, minAlpha) * vOpacity;

// gl_FragColor.a = 0.15;


// varying vec3 ghostVnormal;
// varying vec3 ghostvEye;

      