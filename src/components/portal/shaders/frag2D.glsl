uniform sampler2D map;

uniform sampler2D tInfo;

varying vec2 vUvBackground;

#include <fog_pars_fragment>



void main() {

    vec4 finalColor = texture2D(map, vUvBackground);

    gl_FragColor = finalColor;

    #include <colorspace_fragment>


    #include <fog_fragment>
}
