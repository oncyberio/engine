vec3 originalPosition = position;

mat3 rotateMatrix = rotateY(rotationY);

highp float timeMix = smoothstep( 0.0, animations.w, ((timer) - animations.z)  );

float timerStartDifference = ((timer) - animations.z);

vec4 skinVertex = vec4( position, 1.0 );

mat4 skinMatrixB = getAnimationPosition( getMetaData(animations.y, META_DATA_ARRAY), getAdditionalMetaData(animations.y, ADDITIONAL_META_DATA_ARRAY), timerStartDifference );

vec3 positionB = ( skinMatrixB *  skinVertex).xyz;

vec3 position = positionB;

#ifdef USE_NORMAL

    finalNormal = normal;

    finalNormal = vec4( skinMatrixB * vec4( finalNormal, 0.0 ) ).xyz;

#endif

if( timeMix < 1.0 ){

    mat4 skinMatrixA =  getAnimationPosition( getMetaData(animations.x, META_DATA_ARRAY), getAdditionalMetaData(animations.x, ADDITIONAL_META_DATA_ARRAY), timerStartDifference );

    vec3 positionA = ( skinMatrixA *  skinVertex).xyz;

    position = mix( positionA, position, timeMix );

    finalNormal  = mix( vec4( skinMatrixA * vec4( finalNormal, 0.0 ) ).xyz, finalNormal, timeMix );
}

position = getPosition( rotateMatrix, position );

#ifdef USE_NORMAL

    finalNormal =  getNormal( rotateMatrix, finalNormal );

    vec3 normal = finalNormal;

#endif

localmvPosition = modelViewMatrix * vec4(position, 1.0);

