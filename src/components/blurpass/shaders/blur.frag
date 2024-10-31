uniform sampler2D tInput;

#ifdef USE_VARYING

    varying vec2 v_uv[9];

#else

    uniform vec2 direction;

    varying vec2 vUv;

#endif
void main() {


    #ifdef USE_VARYING

        #ifdef USE_RGBA
            vec4 color = texture2D( tInput, v_uv[0] ) * 0.1633;
            color += texture2D( tInput, v_uv[1] ) * 0.1531;
            color += texture2D( tInput, v_uv[2] ) * 0.1531;
            color += texture2D( tInput, v_uv[3] ) * 0.12245;
            color += texture2D( tInput, v_uv[4] ) * 0.12245;
            color += texture2D( tInput, v_uv[5] ) * 0.0918;
            color += texture2D( tInput, v_uv[6] ) * 0.0918;
            color += texture2D( tInput, v_uv[7] ) * 0.051;
            color += texture2D( tInput, v_uv[8] ) * 0.051;
            gl_FragColor = color;
        #else
            vec4 center = texture2D( tInput, v_uv[0] );
            vec3 color = center.rgb * 0.1633;
            color += texture2D( tInput, v_uv[1] ).rgb * 0.1531;
            color += texture2D( tInput, v_uv[2] ).rgb * 0.1531;
            color += texture2D( tInput, v_uv[3] ).rgb * 0.12245;
            color += texture2D( tInput, v_uv[4] ).rgb * 0.12245;
            color += texture2D( tInput, v_uv[5] ).rgb * 0.0918;
            color += texture2D( tInput, v_uv[6] ).rgb * 0.0918;
            color += texture2D( tInput, v_uv[7] ).rgb * 0.051;
            color += texture2D( tInput, v_uv[8] ).rgb * 0.051;
            gl_FragColor = vec4(color, center.a);
        #endif

    #else

        vec2 uv = vUv;

        vec2 v_uv_0 = uv;
        vec2 delta = direction;
        vec2 v_uv_1 = uv - delta;
        vec2 v_uv_2 = uv + delta;
        delta += direction;
        vec2 v_uv_3 = uv - delta;
        vec2 v_uv_4 = uv + delta;
        delta += direction;
        vec2 v_uv_5 = uv - delta;
        vec2 v_uv_6 = uv + delta;
        delta += direction;
        vec2 v_uv_7 = uv - delta;
        vec2 v_uv_8 = uv + delta;

        #ifdef USE_RGBA
            vec4 color = texture2D( tInput, v_uv_0 ) * 0.1633;
            color += texture2D( tInput, v_uv_1 ) * 0.1531;
            color += texture2D( tInput, v_uv_2 ) * 0.1531;
            color += texture2D( tInput, v_uv_3 ) * 0.12245;
            color += texture2D( tInput, v_uv_4 ) * 0.12245;
            color += texture2D( tInput, v_uv_5 ) * 0.0918;
            color += texture2D( tInput, v_uv_6 ) * 0.0918;
            color += texture2D( tInput, v_uv_7 ) * 0.051;
            color += texture2D( tInput, v_uv_8 ) * 0.051;
            gl_FragColor = color;
        #else
            vec4 center = texture2D( tInput, v_uv_0 );
            vec3 color = center.rgb * 0.1633;
            color += texture2D( tInput, v_uv_1 ).rgb * 0.1531;
            color += texture2D( tInput, v_uv_2 ).rgb * 0.1531;
            color += texture2D( tInput, v_uv_3 ).rgb * 0.12245;
            color += texture2D( tInput, v_uv_4 ).rgb * 0.12245;
            color += texture2D( tInput, v_uv_5 ).rgb * 0.0918;
            color += texture2D( tInput, v_uv_6 ).rgb * 0.0918;
            color += texture2D( tInput, v_uv_7 ).rgb * 0.051;
            color += texture2D( tInput, v_uv_8 ).rgb * 0.051;
            gl_FragColor = vec4(color, center.a);
        #endif

    #endif


}
