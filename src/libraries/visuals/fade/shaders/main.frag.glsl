#ifdef FADE

    #define level 0.016

    float dist = -FADEvEye.z;

    vec3 fades = vec3( 1.0 ) - fade( vec3(level), -FADEvEye.xyz, smoothstep(1.5, 2.0, dist) );

    if ( min(fades.x * fades.y * fades.z, opacity) < 0.01) discard;


#endif