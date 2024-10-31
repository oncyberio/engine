#define CUBEUV_TEXEL_WIDTH 0.0013020833333333333
#define CUBEUV_TEXEL_HEIGHT 0.0010080645161290322
#define CUBEUV_MAX_MIP 8.0

// #ifdef ENVMAP_TYPE_CUBE_UV
#define cubeUV_minMipLevel 4.0
#define cubeUV_minTileSize 16.0
float getFace( vec3 direction ) {
    vec3 absDirection = abs( direction );
    float face = - 1.0;
    if ( absDirection.x > absDirection.z ) {
        if ( absDirection.x > absDirection.y )
        face = direction.x > 0.0 ? 0.0 : 3.0;
        else
        face = direction.y > 0.0 ? 1.0 : 4.0;
    }
    else {
        if ( absDirection.z > absDirection.y )
        face = direction.z > 0.0 ? 2.0 : 5.0;
        else
        face = direction.y > 0.0 ? 1.0 : 4.0;
    }
    return face;
}
vec2 getUV( vec3 direction, float face ) {
    vec2 uv;
    if ( face == 0.0 ) {
        uv = vec2( direction.z, direction.y ) / abs( direction.x );
    }
    else if ( face == 1.0 ) {
        uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
    }
    else if ( face == 2.0 ) {
        uv = vec2( - direction.x, direction.y ) / abs( direction.z );
    }
    else if ( face == 3.0 ) {
        uv = vec2( - direction.z, direction.y ) / abs( direction.x );
    }
    else if ( face == 4.0 ) {
        uv = vec2( - direction.x, direction.z ) / abs( direction.y );
    }
    else {
        uv = vec2( direction.x, direction.y ) / abs( direction.z );
    }
    return 0.5 * ( uv + 1.0 );
}
vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
    float face = getFace( direction );
    float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
    mipInt = max( mipInt, cubeUV_minMipLevel );
    float faceSize = exp2( mipInt );
    vec2 uv = getUV( direction, face ) * ( faceSize - 1.0 ) + 0.5;
    if ( face > 2.0 ) {
        uv.y += faceSize;
        face -= 3.0;
    }
    uv.x += face * faceSize;
    uv.x += filterInt * 3.0 * cubeUV_minTileSize;
    uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
    uv.x *= CUBEUV_TEXEL_WIDTH;
    uv.y *= CUBEUV_TEXEL_HEIGHT;
    return texture2D( envMap, uv ).rgb;
}
#define r0 1.0
#define v0 0.339
#define m0 - 2.0
#define r1 0.8
#define v1 0.276
#define m1 - 1.0
#define r4 0.4
#define v4 0.046
#define m4 2.0
#define r5 0.305
#define v5 0.016
#define m5 3.0
#define r6 0.21
#define v6 0.0038
#define m6 4.0
float roughnessToMip( float roughness ) {
    float mip = 0.0;
    if ( roughness >= r1 ) {
        mip = ( r0 - roughness ) * ( m1 - m0 ) / ( r0 - r1 ) + m0;
    }
    else if ( roughness >= r4 ) {
        mip = ( r1 - roughness ) * ( m4 - m1 ) / ( r1 - r4 ) + m1;
    }
    else if ( roughness >= r5 ) {
        mip = ( r4 - roughness ) * ( m5 - m4 ) / ( r4 - r5 ) + m4;
    }
    else if ( roughness >= r6 ) {
        mip = ( r5 - roughness ) * ( m6 - m5 ) / ( r5 - r6 ) + m5;
    }
    else {
        mip = - 2.0 * log2( 1.16 * roughness );
    }
    return mip;
}
vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
    float mip = clamp( roughnessToMip( roughness ), m0, CUBEUV_MAX_MIP );
    float mipF = fract( mip );
    float mipInt = floor( mip );
    vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
    if ( mipF == 0.0 ) {
        return vec4( color0, 1.0 );
    }
    else {
        vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
        return vec4( mix( color0, color1, mipF ), 1.0 );
    }

}
// #endif

varying vec3 vReflect;

uniform sampler2D envMap;

void main() {


	vec3 reflectVec = vReflect;

	vec4 envColor = textureCubeUV( envMap, reflectVec, 0.0 );

	gl_FragColor = envColor;

    #include <colorspace_fragment>

}
