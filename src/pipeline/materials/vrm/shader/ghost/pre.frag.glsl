varying vec4 localmvPosition;

vec3 fade(vec3 level, vec3 pos, float dist) {

    vec3 halfLevel = level * 0.5;

    return step(dist * 1.01, (abs(mod(pos, level) - halfLevel) / halfLevel));

}

#ifdef USE_NORMAL

    varying vec3 finalNormal;

#endif


varying vec3 ghostVnormal;
varying vec3 ghostvEye;

uniform float rimPower;

uniform float minAlpha;