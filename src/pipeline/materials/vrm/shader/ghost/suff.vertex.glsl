#ifdef USE_ATLAS

    vMapUv.y = 1.0 - vMapUv.y;

    vMapUv = ( vMapUv * atlas.xy) + atlas.zw;

#endif
ghostvEye = ( modelViewMatrix * vec4( transformed, 1.0 ) ).xyz;

ghostVnormal = normalize( normalMatrix * normal );