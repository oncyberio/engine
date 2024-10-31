ghostvEye = ( modelViewMatrix * vec4( transformed, 1.0 ) ).xyz;

ghostVnormal = normalize( normalMatrix * normal );