varying float alpha;

varying vec3 vColor;

varying vec3 vNormal;

const vec3 direction = vec3(1.0, 1.0, -1.0);

void main() {

  float light = max(dot(vNormal, direction), 0.0);

  gl_FragColor = vec4( mix( vColor * 0.9, vColor * 1.5, min(light, 0.4)), alpha);
  // gl_FragColor = vec4( mix( vColor, vColor * 1.5, min(light, 0.4)), alpha);
  // gl_FragColor = vec4(vColor, 1.0);

}
