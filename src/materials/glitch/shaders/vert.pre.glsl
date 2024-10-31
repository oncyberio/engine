attribute   vec3 offset;

attribute   float rotationY;

attribute   vec4 rotation;

attribute   vec3 scale;

#pragma glslify: import('../../common/transformposition.glsl')

#ifdef USE_INSTANCE_COLOR

    #define USE_COLOR 

    attribute vec3 icolor;

#endif


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

varying float vWorldPosition;

uniform float timer;

varying vec2 vUv;