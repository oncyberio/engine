void main() {

   gl_Position = vec4( position.xy, 0.0,  1.0 );

   gl_Position.z = gl_Position.w;

}
