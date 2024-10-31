varying vec2 vUv;
varying vec2 ssp;


vec3 vPosModu( vec3 pos ){

	vec3 temp = vec4(modelMatrix * vec4( pos, 1.0 )).xyz;

	temp.x *= 1.1;

	return temp;
}

void main() {

  vUv = uv;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);


  ssp = vec3(( gl_Position.xyz / gl_Position.w ) * 0.5 + 0.5).xy;

  gl_Position.z = gl_Position.w;

}