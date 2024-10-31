if(nShiftPower > 0.0){

    gl_FragColor = vec4(rgbShift(vUv, map), 1.0);
}

gl_FragColor.rgb 	   *= scan(vUv);

#ifndef MIRROR 

    #ifndef NO_GRID

        gl_FragColor.rgb 		*= grid(vUv * texture_ratio);

    #endif

#endif


float a = min(gl_FragColor.r + gl_FragColor.g + gl_FragColor.b, 1.0);

if( a < 0.1 ) {
    discard;
}

