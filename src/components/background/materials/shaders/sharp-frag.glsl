uniform sampler2D map;

varying vec2 vUv;

void main() {

    gl_FragColor = texture2D(map, vUv);

    #include <colorspace_fragment>
}
