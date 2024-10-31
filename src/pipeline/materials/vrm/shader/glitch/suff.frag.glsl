#ifdef USE_MAP

    if(nShiftPower > 0.0){

        gl_FragColor = vec4(rgbShift(vUv, map), 1.0);

    }
#endif

gl_FragColor.rgb 	   *= scan(vUv);

#ifndef MIRROR 

    #ifndef NO_GRID

        gl_FragColor.rgb 		*= grid(vUv * texture_ratio);

    #endif

#endif

