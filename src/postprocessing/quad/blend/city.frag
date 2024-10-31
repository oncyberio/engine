varying vec2 vUv; 

// varying vec2 vUv2;

uniform sampler2D tInput;

uniform sampler2D tInput2;
uniform float intensity;
uniform float correctColor;


// uniform sampler2D lut;

const vec3 W = vec3(0.2125, 0.7154, 0.0721);


float czm_luminance(vec3 rgb)
{
    // Algorithm from Chapter 10 of Graphics Shaders.
    return dot(rgb, W);
}

// #define LUT_FLIP_Y

#define INV_512         0.001953125
#define INV_512_HALF    0.0009765625
#define INV_8           0.125

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
    return newColor;
}

varying vec2 vPosition;

vec4 when_lt(vec4 x, vec4 y) {
  return max(sign(y - x), 0.0);
}

vec4 SRGBToLinear(vec4 sRGB)
{
    vec4 cutoff = when_lt(sRGB, vec4(0.04045));
    vec4 higher = pow((sRGB + vec4(0.055))/vec4(1.055), vec4(2.4));
    vec4 lower = sRGB/vec4(12.92);

    return mix(higher, lower, cutoff);

}


// #define saturate(a) clamp( a, vec4(0.0), vec4(1.0) )

// vec4 SRGBToLinear(vec4 sRGB)
// {
//     vec4 cutoff = when_lt(sRGB, vec4(0.04045));
//     vec4 higher = pow((sRGB + vec4(0.055))/vec4(1.055), vec4(2.4));
//     vec4 lower = sRGB/vec4(12.92);

//     return mix(higher, lower, cutoff);

// }

vec4 addblend(const in vec4 x, const in vec4 y, const in float opacity) {

    return mix(x, x + y, opacity);

}



void main() { 

    // vec4 base       = lookup(saturate(texture2D(tInput, vUv)), lut);
    vec4 base       = (texture2D(tInput, vUv));
    
    vec4 blend      = texture2D( tInput2, vUv ) * intensity * 5.0;

    vec4 temp       = (1.0 - ((1.0 - base) * (1.0 - blend)));

    float lumi   = czm_luminance(temp.rgb);

    temp.rgb       +=  ((1.0 - lumi) * 0.08) * correctColor;

    // gl_FragColor = addblend( base, blend, 1.0);
    gl_FragColor = temp;

    #include <colorspace_fragment>


     // gl_FragColor = LinearTosRGB( gl_FragColor );

}
