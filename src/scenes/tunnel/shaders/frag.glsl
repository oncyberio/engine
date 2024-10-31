uniform sampler2D map;

varying vec2 vUv;

void main() { 

    gl_FragColor = texture2D(map, vUv);

    // gl_FragColor.a = 1.0;
    // gl_FragColor = vec4(vUv, 1.0, 1.0);
}