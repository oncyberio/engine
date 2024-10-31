float rimPower = 1.0;

float f = rimPower * abs( dot( ghostVnormal, normalize( ghostvEye ) ) );
f =  ( 1. - smoothstep( 0.0, 1., f ) );

gl_FragColor.rgb += vec3( f * gl_FragColor.rgb);

gl_FragColor.a = max(f, minAlpha) * vOpacity;