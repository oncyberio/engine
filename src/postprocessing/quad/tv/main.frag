varying vec2 vUv; 

uniform sampler2D tInput;

varying vec2 vUv2;

uniform float dattime;

uniform float vignetteStrength;

uniform float vignetteFallOff;

uniform float amount;

uniform float speed;

uniform float strength;

uniform float glitchRatio;


const float scale = 1200.0;
const float amt = 0.025;// intensity of effect
const float spd = 2.0;//speed of scrolling rows transposed per second

float luma(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

float luma(vec4 color) {
  return dot(color.rgb, vec3(0.299, 0.587, 0.114));
}


vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
  return mod289(((x*34.0)+1.0)*x);
}

float snoise(vec2 v)
  {
  const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                      0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                     -0.577350269189626,  // -1.0 + 2.0 * C.x
                      0.024390243902439); // 1.0 / 41.0
// First corner
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);

// Other corners
  vec2 i1;
  //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
  //i1.y = 1.0 - i1.x;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  // x0 = x0 - 0.0 + 0.0 * C.xx ;
  // x1 = x0 - i1 + 1.0 * C.xx ;
  // x2 = x0 - 1.0 + 2.0 * C.xx ;
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

// Permutations
  i = mod289(i); // Avoid truncation effects in permutation
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));

  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;

// Gradients: 41 points uniformly over a line, mapped onto a diamond.
// The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

// Normalise gradients implicitly by scaling m
// Approximation of: m *= inversesqrt( a0*a0 + h*h );
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );

// Compute final noise value at P
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// float rand(vec2 co)
// {
//    return fract(sin(dot(co.xy,vec2(12.9898,78.233))) * 43758.5453);
// }

float rand(vec2 o)
{
  vec2 p = o * 256.0;
  vec3 p3  = fract(vec3(p.xyx) * .1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}


float when_eq(float x, float y) {
  return 1.0 - abs(sign(x - y));
}



vec4 getGlitch(sampler2D inTex, float noise, float xpos, float timer ){

    vec4 final = texture2D(inTex, vec2(xpos, vUv.y));

    final.rgb = mix(final.rgb, vec3(rand(vec2(vUv.y * timer))), noise * 0.3).rgb;
    
        // Apply a line pattern every 4 pixels
    final.rgb *= mix(1.0 - (0.15 * noise), 1.0, when_eq(floor(mod(vUv.y * 0.5, 1.0)), 0.0) );
    
    // Shift green/blue channels (using the red channel)
    final.g = mix(final.g, texture2D(inTex, vec2(xpos + noise * 0.05 * strength, vUv.y)).g, 1.0);
    final.b = mix(final.b, texture2D(inTex, vec2(xpos - noise * 0.05 * strength, vUv.y)).b, 1.0);

    return mix(final,  texture2D(inTex, vUv + vec2(-noise * 0.1, 0.0)), 0.2);
}


vec3 scanline(vec2 coord, vec3 screen, float timer){
  
    screen.rgb += sin((coord.y * scale - (timer * spd * 6.28))) * amt;
    return screen;
}

void main() { 

    float t = dattime * speed;

        // Create large, incidental noise waves
    float noise = max(0.0, snoise(vec2(t, vUv.y * 0.3)) - 0.3) * (1.42857);
    
    // Offset by smaller, constant noise waves
    noise = noise + (snoise(vec2(t*10.0, vUv.y * 2.4)) - 0.5) * 0.15;
        
    vec4 base = vec4(1.0);

    vec4 original = texture2D(tInput, vUv);
   
    float xpos = vUv.x - (noise * noise * 0.25) * strength ;

    float randX = rand( vec2(t) );

    base = original;

    if(randX < glitchRatio ){

      base = getGlitch(tInput, noise, xpos, t);
    }

    vec4 final        = base;

    vec4 storeFinal   = final;

    float dist        = distance(vUv2, vec2(0.5));

    final.rgb        *= smoothstep(0.8, vignetteFallOff * 0.799, dist * (vignetteStrength + vignetteFallOff));

    final.rgb = scanline(vUv, final.rgb, t);

    gl_FragColor      = mix(original,  final, amount);

    #include <colorspace_fragment>
}
