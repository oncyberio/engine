

#ifdef USE_VARYING

    uniform vec2 direction;
    
    varying vec2 v_uv[9];

#else

    varying vec2 vUv;

#endif


void main() {

    vec2 uv = position.xy * 0.5 + 0.5;

    #ifdef USE_VARYING

        v_uv[0] = uv;
        vec2 delta = direction;
        v_uv[1] = uv - delta;
        v_uv[2] = uv + delta;
        delta += direction;
        v_uv[3] = uv - delta;
        v_uv[4] = uv + delta;
        delta += direction;
        v_uv[5] = uv - delta;
        v_uv[6] = uv + delta;
        delta += direction;
        v_uv[7] = uv - delta;
        v_uv[8] = uv + delta;

    #else

        vUv = uv;

    #endif
 
    gl_Position = vec4( position, 1.0 );
}
