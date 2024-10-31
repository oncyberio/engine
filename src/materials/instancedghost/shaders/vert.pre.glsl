attribute   vec3 offset;

attribute   float rotationY;

attribute   vec4 rotation;

attribute   vec3 scale;

#pragma glslify: import('../../common/transformposition.glsl')

#ifdef USE_INSTANCE_COLOR

    #define USE_COLOR 

    attribute vec3 icolor;

#endif

varying vec3 ghostvEye;
varying vec3 ghostVnormal;

 