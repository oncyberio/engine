#ifndef FADE

    #define FADE

     varying vec4 FADEvEye;
    
     vec3 fade(vec3 level, vec3 pos, float dist) {

        vec3 halfLevel = level * 0.5;

        return step(dist * 1.01, (abs(mod(pos, level) - halfLevel) / halfLevel));
    }
    
#endif