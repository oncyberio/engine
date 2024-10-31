varying vec2 vUv; 

uniform sampler2D tInput;

uniform sampler2D lutTexture;

#define INV_512         0.001953125
#define INV_512_HALF    0.0009765625
#define INV_8           0.125

#define LUT_FLIP_Y 1.0

vec4 lookup(in vec4 textureColor, in sampler2D lookupTable) {
    #ifndef LUT_NO_CLAMP
        textureColor = clamp(textureColor, 0.0, 1.0);
    #endif

    mediump float blueColor = textureColor.b * 63.0;

    mediump vec2 quad1;
    quad1.y = floor(floor(blueColor) * INV_8);
    quad1.x = floor(blueColor) - (quad1.y * 8.0);

    mediump vec2 quad2;
    quad2.y = floor(ceil(blueColor) * INV_8);
    quad2.x = ceil(blueColor) - (quad2.y * 8.0);

    highp vec2 texPos1;
    texPos1.x = (quad1.x * 0.125) + INV_512_HALF + ((0.125 - INV_512) * textureColor.r);
    texPos1.y = (quad1.y * 0.125) + INV_512_HALF + ((0.125 - INV_512) * textureColor.g);

    #ifdef LUT_FLIP_Y
        texPos1.y = 1.0-texPos1.y;
    #endif

    highp vec2 texPos2;
    texPos2.x = (quad2.x * 0.125) + INV_512_HALF + ((0.125 - INV_512) * textureColor.r);
    texPos2.y = (quad2.y * 0.125) + INV_512_HALF + ((0.125 - INV_512) * textureColor.g);

    #ifdef LUT_FLIP_Y
        texPos2.y = 1.0-texPos2.y;
    #endif

    lowp vec4 newColor1 = texture2D(lookupTable, texPos1);
    lowp vec4 newColor2 = texture2D(lookupTable, texPos2);

    lowp vec4 newColor = mix(newColor1, newColor2, fract(blueColor));

    newColor.a = textureColor.a;
    return newColor;
}


#define saturate(a) clamp( a, vec4(0.0), vec4(1.0) )


void main() { 

    vec4 base       = lookup(saturate(texture2D(tInput, vUv)), lutTexture);
    
    gl_FragColor = base;


    // #include <colorspace_fragment>


}
