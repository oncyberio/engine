#ifndef FADEANDFAKELIGHT

    #define FADEANDFAKELIGHT

     varying vec4 FADEANDFAKELIGHTvEye;
    
     vec3 fade(vec3 level, vec3 pos, float dist) {

        vec3 halfLevel = level * 0.5;

        return step(dist * 1.01, (abs(mod(pos, level) - halfLevel) / halfLevel));

    }

    #ifdef USE_NORMAL

        varying vec3 finalNormal;

    #endif
    
#endif