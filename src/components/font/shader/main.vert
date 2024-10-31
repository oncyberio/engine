

varying vec2 vUv;

varying vec3 vColor;

#ifdef INSTANCED

	attribute vec3 icolor;

	attribute vec3 offset;

	attribute vec3 scale;

	attribute vec4 font_uv;
	attribute vec3 char_offset;
	attribute vec3 char_scale;

	attribute vec4 rotation;
	
	attribute float aOpacity;

	varying float vOpacity;

#else

	attribute vec3 color;

#endif

vec3 applyQuat( vec4 q, vec3 v ){

    return v + 2.0 * cross( q.xyz, cross( q.xyz, v ) + q.w * v );
}

vec3 getPositionWithOptions( vec3 p, vec3 s, vec4 r, vec3 o){

    #ifndef INSTANCE

       return p;

    #endif

    vec4 quat = r;

    vec3 pos = p;


    return applyQuat ( quat, ( pos * s )) + o;

}




#include <fog_pars_vertex>

vec3 billboard(vec3 v, mat4 view, vec3 center, float size, vec3 off) {

    
    vec3 lookat = cameraPosition + (vec3(view[0][2], view[1][2], view[2][2])) * 1500.0;

    vec3 look = normalize(lookat - center);
    // vec3 look = normalize(cameraPosition - center);
    vec3 cameraUp = vec3(view[0][1], view[1][1], view[2][1]);
    vec3 billboardRight = cross(cameraUp, look);
    vec3 billboardUp = cross(look, billboardRight);
    vec3 pos = off + billboardRight * v.x * size + billboardUp * v.y * size;
    return pos;
}


// void main() {

//     vOpacity = opacity;

//     vUv = ( uv * atlas.xy) + atlas.zw;

//     vec3 finalP = billboard( vec3(  position.xy, 0.0) , viewMatrix, offset.xyz , 0.75, offset.xyz);

//     close = smoothstep(2.0, 5.5, distance( cameraPosition.xyz , ( modelMatrix * vec4(finalP, 1.0) ).xyz  ));

// 	gl_Position = projectionMatrix * modelViewMatrix * vec4( finalP , 1.0 );
// }


#ifdef DEPTH

	varying vec2 vHighPrecisionZW;

#endif

void main() {

	vUv = uv;



	vec3 transformed = position.xyz;

	#ifdef INSTANCED 

		vColor = icolor;
	
		vOpacity = aOpacity;	

		#ifdef BILLBOARD

	    	transformed = billboard( vec3(  position.xy  * char_scale.xy + char_offset.xy , 0.0) , viewMatrix, offset.xyz , scale.x, offset.xyz);

		#else

			transformed =  applyQuat ( rotation, ( (position.xyz * char_scale * scale.x + char_offset * scale.x ))) + offset ;

		#endif
		// transformed =   applyQuat ( rotation, ( (position.xyz  * char_scale + char_offset ))) + offset;

		vUv.y = 1.0 - vUv.y;

		vUv   = font_uv.xy + font_uv.zw * vUv;

		vUv.y = 1.0 - vUv.y;

	#else

		vColor = color;

	#endif

    vec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 );

   

	#ifndef DEPTH

	 	#include <worldpos_vertex>

		#include <fog_vertex>

	#endif

	gl_Position = projectionMatrix * mvPosition;

	#ifdef DEPTH
	
		vHighPrecisionZW = gl_Position.zw;

	#endif

}