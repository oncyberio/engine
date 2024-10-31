uniform sampler2D boneTexture;

uniform highp float timer;

attribute vec3 offset;

uniform mat4 bindMatrix;

uniform mat4 bindMatrixInverse;

attribute vec4 skinIndex;

attribute vec4 skinWeight;

attribute float scale;

attribute vec4 animations;

attribute float rotationY;

uniform vec3 baseScale;

varying vec2 vHighPrecisionZW;


#include <common>

mat3 rotateY( float rad ) {
    float c = cos(rad);
    float s = sin(rad);
    return mat3(
        c, 0.0, -s,
        0.0, 1.0, 0.0,
        s, 0.0, c
    );
}

vec3 getPosition( mat3 rotatemat, vec3 pos ){

    return rotatemat * ( pos * baseScale * scale) + offset;
    // return pos + offset;
}

vec3 getNormal(mat3 rotatemat, vec3 norm ){

    return rotatemat * norm;
    // return pos + offset;
}


mat4 getBoneMatrix( const in float i, float frame, vec4 atlas) {

	float x =  i * 4.0 ;
	// fuck
	float y = PX_HEIGHT * ( frame + 0.5 ) + atlas.y;

	vec4 v1 = texture2D( boneTexture, vec2( PX_WIDTH * ( x + 0.5 ) + atlas.x , y ) );
	vec4 v2 = texture2D( boneTexture, vec2( PX_WIDTH * ( x + 1.5 ) + atlas.x , y ) );
	vec4 v3 = texture2D( boneTexture, vec2( PX_WIDTH * ( x + 2.5 ) + atlas.x , y ) );
	vec4 v4 = texture2D( boneTexture, vec2( PX_WIDTH * ( x + 3.5 ) + atlas.x , y ) );

	mat4 bone = mat4( v1, v2, v3, v4 );

	return bone;
}

vec4 getMetaDataTex( float animation ){

	vec4 metaDataAtlas = vec4( META_DATA_UV_OFFSET_X, META_DATA_UV_OFFSET_Y, META_DATA_UV_SCALE_X, META_DATA_UV_SCALE_Y);

	return texture2D( boneTexture, vec2(META_DATA_UV_OFFSET_X + (PX_WIDTH * 0.5) + (PX_WIDTH * animation), META_DATA_UV_OFFSET_Y + PX_HEIGHT * 0.5) );

}

vec4 getAdditionalMetaDataTex( float animation ){

	vec4 metaDataAtlas = vec4( ADDITIONAL_META_DATA_UV_OFFSET_X, ADDITIONAL_META_DATA_UV_OFFSET_Y, ADDITIONAL_META_DATA_UV_SCALE_X, ADDITIONAL_META_DATA_UV_SCALE_Y);

	return texture2D( boneTexture, vec2(ADDITIONAL_META_DATA_UV_OFFSET_X + (PX_WIDTH * 0.5) + (PX_WIDTH * animation), ADDITIONAL_META_DATA_UV_OFFSET_Y + PX_HEIGHT * 0.5) );

}


mat4 getBonesMatrices( float frameA, vec4 atlasA ){

	mat4 boneMatXA = getBoneMatrix( skinIndex.x, frameA, atlasA );
	mat4 boneMatYA = getBoneMatrix( skinIndex.y, frameA, atlasA );
	mat4 boneMatZA = getBoneMatrix( skinIndex.z, frameA, atlasA );
	mat4 boneMatWA = getBoneMatrix( skinIndex.w, frameA, atlasA );

	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatXA;
	skinMatrix += skinWeight.y * boneMatYA;
	skinMatrix += skinWeight.z * boneMatZA;
	skinMatrix += skinWeight.w * boneMatWA;
	skinMatrix  = bindMatrixInverse * skinMatrix;
	// skinMatrix  = bindMatrixInverse;
	
	return skinMatrix;
}

mat4 getAnimationPosition( vec4 metaData, vec4 additionalMetaData, float timerStart ) {

	vec4 animationAtlasA = metaData;
	// framesCount
	float frameCountA = (animationAtlasA.a * TEXTURE_HEIGHT);

	float currentFrame = 0.0;

	// x is loop state 
	if( additionalMetaData.x > 0.5 ) {

		currentFrame = mod( floor( (timer) / FPS), max(frameCountA - 1.0, 1.0) ); 
	}
	else {

		currentFrame = min( floor( timerStart / FPS),  max(frameCountA - 1.0, 1.0));

	}

	return getBonesMatrices( currentFrame,  animationAtlasA );
	
}

vec4 getMetaData(float id, vec4 data[META_DATA_LENGTH]) {

	return data[int(id)];
}

vec4 getAdditionalMetaData(float id, vec4 data[META_DATA_LENGTH]) {

	return data[int(id)];
}


void main() {

	// animations : [  ]

	// [previousAnimationIndex, new animation index, current animation timer , new animation timer start ] 

	mat3 rotateMatrix = rotateY(rotationY);

	highp float timeMix = smoothstep( 0.0, animations.w, ((timer) - animations.z)  );

	float timerStartDifference = ((timer) - animations.z);

	vec4 skinVertex = vec4( position, 1.0 );

	mat4 skinMatrixB = getAnimationPosition( getMetaData(animations.y, META_DATA_ARRAY), getAdditionalMetaData(animations.y, ADDITIONAL_META_DATA_ARRAY), timerStartDifference );

	vec3 positionB = ( skinMatrixB *  skinVertex).xyz;

	vec3 transformed = positionB;

	if( timeMix < 1.0 ){

		mat4 skinMatrixA =  getAnimationPosition( getMetaData(animations.x, META_DATA_ARRAY), getAdditionalMetaData(animations.x, ADDITIONAL_META_DATA_ARRAY), timerStartDifference );

		vec3 positionA = ( skinMatrixA *  skinVertex).xyz;

		transformed = mix( positionA, transformed, timeMix );

	}

	transformed = getPosition( rotateMatrix, transformed );
	
	gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);

    vHighPrecisionZW = gl_Position.zw;
}    