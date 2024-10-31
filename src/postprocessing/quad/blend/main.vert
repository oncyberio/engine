
float when_fgt(float x, float y) {

	return max(sign(x - y), 0.0);
}

uniform float aspect;

// varying vec2 vPosition;

varying vec2 vUv;

void main() {

   vUv = vec2(0.5)+(position.xy)*0.5;

  //  vUv2 = mix(
  //  	    vec2(

  //  	      vUv.x,
  //  	      vUv.y * 1.0 / aspect + .5 * ( 1. - 1.0 / aspect )
	 //    ),
	 //    vec2(

	 //      vUv.x * aspect / 1.0 + .5 * ( 1. - aspect / 1.0),
	 //      vUv.y
	 //    )

 	// ,when_fgt(1.0, aspect));

 	// vPosition = position.xy;

   gl_Position = vec4( position.xy, 0.0,  1.0 );

}