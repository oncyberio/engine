uniform sampler2D boneTexture;

uniform highp float timer;

uniform highp float glitchTimer;

attribute vec3 offset;

// varying vec2  vUv;

uniform mat4 bindMatrix;

uniform mat4 bindMatrixInverse;

attribute vec4 skinIndex;

attribute vec4 skinWeight;

attribute vec4 rotation;

attribute float opacity;

attribute vec3 scale;

attribute vec4 animations;

attribute float rotationY;

uniform vec3 baseScale;

varying vec4 localmvPosition;



varying 	vec2 vUv;

varying 	float vWorldPosition;

varying 	float vScanSize;

varying 	float nShiftPower;

#define rgb_shift_power 6.0

float rand(float n){return fract(sin(n) * 43758.5453123);}

vec3 when_gt(vec3 x, vec3 y) {
  return max(sign(x - y), 0.0);
}

float when_gt(float x, float y) {
  return max(sign(x - y), 0.0);
}

#define max_flat 8.0

varying vec2 vPosUv;


#ifdef USE_NORMAL

	varying vec3 finalNormal;

#endif


#ifdef USE_ATLAS

	attribute vec4 atlas;

#endif


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
}


mat4 getBoneMatrix( const in float i, float frame, vec4 atlas) {

	float x =  i * 4.0 ;
    // hehe
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
	// y is timeScale 
	if( additionalMetaData.x > 0.5 ) {

		currentFrame = mod( floor( (timer * additionalMetaData.y ) / FPS), max(frameCountA - 1.0, 1.0) ); 
	}
	else {

		currentFrame = min( floor( (timerStart  * additionalMetaData.y )/ FPS),  max(frameCountA - 1.0, 1.0));

	}

	return getBonesMatrices( currentFrame,  animationAtlasA );
	
}

vec4 getMetaData(float id, vec4 data[META_DATA_LENGTH]) {

	return data[int(id)];
}


vec4 getAdditionalMetaData(float id, vec4 data[META_DATA_LENGTH]) {

	return data[int(id)];
}

