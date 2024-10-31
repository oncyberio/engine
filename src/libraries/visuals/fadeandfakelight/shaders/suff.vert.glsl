#ifdef FADEANDFAKELIGHT

    FADEANDFAKELIGHTvEye = modelViewMatrix * vec4(transformed, 1.0);

    #ifdef USE_NORMAL 

        // finalNormal =  normalMatrix * transformedNormal;
        finalNormal = inverseTransformDirection( transformedNormal, viewMatrix );

    #endif

#endif 
