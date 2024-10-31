attribute   vec3 offset;

attribute   float rotationY;

attribute   vec4 rotation;

attribute   vec3 scale;

#pragma glslify: import('../../common/transformposition.glsl')

#ifdef USE_INSTANCE_COLOR

    #define USE_COLOR 

    attribute vec3 icolor;

#endif

#ifdef USE_ATTRIBUTE_OPACITY

    attribute float aOpacity;

    varying float vOpacity;

#endif