#ifdef FADEANDFAKELIGHT

    #define level 0.016

    float dist = -FADEANDFAKELIGHTvEye.z;


    vec3 fades = vec3( 1.0 ) - fade( vec3(level), -FADEANDFAKELIGHTvEye.xyz, smoothstep(1.5, 2.0, dist) );

    if ( min(fades.x * fades.y * fades.z, opacity) < 0.01) discard;

    vec3 direction = vec3(0.5,0.5,0.5);


    vec3 diffuse = diffuse * max(
        dot(finalNormal, direction)
        , 0.5);

#endif