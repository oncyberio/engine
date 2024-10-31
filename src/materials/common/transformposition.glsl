
vec3 applyQuat( vec4 q, vec3 v ){

    return v + 2.0 * cross( q.xyz, cross( q.xyz, v ) + q.w * v );
}

// vec4 quat_from_axis_angle(vec3 axis, float angle){

//     float half_angle = (angle * 0.5);

//     return vec4( axis * sin(half_angle) , cos(half_angle));
// }

  
// vec4 quat_mult(vec4 q1, vec4 q2){ 
  
//     return vec4(
//      q2.xyz * q1.w + q1.xyz * q2.w + cross(q1.xyz, q2.xyz),
//      q1.w * q2.w - dot(q1.xyz, q2.xyz)
//  );
// }
 
#if defined(ROTATING) || defined(UV_SHIFT_X) || defined(UV_SHIFT_Y)

    uniform float timer;
    
#endif

mat3 rotateY(float rad) {
    float c = cos(rad);
    float s = sin(rad);
    return mat3(
        c, 0.0, -s,
        0.0, 1.0, 0.0,
        s, 0.0, c
    );
}

vec3 getPosition(){

    #ifndef INSTANCE

       return position;

    #endif

    vec4 quat = rotation;

    vec3 pos = position;

    #ifdef ROTATING

        pos = rotateY(timer)  * pos;

    #endif

    return applyQuat ( quat, ( pos * scale )) + offset;

}

vec3 getPositionWithOptions( vec3 p, vec3 s, vec4 r, vec3 o){

    #ifndef INSTANCE

       return p;

    #endif

    return applyQuat ( r, ( p * s )) + o;

}

vec3 getPositionWithOptions( vec3 p, vec3 s, vec4 r, vec3 o, float y ){

    #ifndef INSTANCE

       return p;

    #endif

    vec4 quat = r;

    vec3 pos = p;

    pos = rotateY(y)  * pos;

    return applyQuat ( quat, ( pos * s )) + o;

}


vec3 getNormal(){

    #ifndef INSTANCE

       return normal;

    #endif

    vec4 quat = rotation;

    vec3 pos = normal;

    #ifdef ROTATING

        pos = rotateY(timer)  * pos;

    #endif

    return applyQuat ( quat, ( pos * scale ));

}


vec3 getNormalWithOptions(vec3 p, vec3 s, vec4 r, vec3 o ){

    #ifndef INSTANCE

       return normal;

    #endif

    vec4 quat = r;

    vec3 pos = p;

    #ifdef ROTATING

        pos = rotateY(timer)  * pos;

    #endif

    return applyQuat ( quat, ( pos ));

}