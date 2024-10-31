attribute float countID;

attribute vec3 color;

uniform float timer;

varying float alpha;

varying vec3 vColor;

varying vec3 vNormal;

#define SCALE 0.03

#define PI 3.1415926

mat4 rotation3d(vec3 axis, float angle) {
  axis = normalize(axis);
  float s = sin(angle);
  float c = cos(angle);
  float oc = 1.0 - c;

  return mat4(
    oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
    oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
    oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
    0.0,                                0.0,                                0.0,                                1.0
  );
}


float rand(vec2 co){

    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

#ifdef circle
  
  float datSeed = 10000.0 + BASE_SEED;

#else 

  float datSeed = 0.0 + BASE_SEED;

#endif


float rd(){

  datSeed += 5.0;

  return rand( vec2(countID, datSeed)); 
}

float exponentialOut(float t) {
  return t == 1.0 ? t : 1.0 - pow(2.0, -10.0 * t);
}

float exponentialIn(float t) {
  return t == 0.0 ? t : pow(2.0, 10.0 * (t - 1.0));
}

float cubicIn(float t){
  return t * t * t;
}

// #define loop 5.0

void main() {


  vColor = color;

  float timer = timer;

  float easeTimer = exponentialOut(timer / LOOP) * LOOP;


  float decal = rd() * 0.2;


  float decaltimer = timer + rd() * 2.0;
  
  // float PI = 3.1416;

  // vec3 xScale = vec3(0.4);

  
  float datangle = exponentialOut(rd() - PI * 0.25) * PI;
  float forceX = cos(2.0 * PI * datangle);
  float forceY = sin(2.0 * PI * datangle);


  vec3 axis = vec3(  sin(rd() * PI + timer),  cos(rd() * PI - timer * 0.5),  sin(rd() * PI - timer * 2.0));


  float speedX = (rd() * 0.9 + 0.1) ;

  float speedY = (rd() * 0.9 + 0.1);
  // float speedAngle = (rd() * 0.5 + 0.5) * 8.0 - smoothstep(LOOP, LOOP - 2.0, timer) * 10.0;
  // float speedAngle = (rd() * 0.5 + 0.5) * 8.0 -exponentialIn(smoothstep(LOOP, 0.0, timer)) * 10.0;
  float speedAngle = (rd() * 0.5 + 0.5) * 8.0 - timer;

  float angle = (rd() * 15.0 * timer) + speedAngle;
    

  vec3 position = vec4( rotation3d( axis, angle ) * vec4(position * SCALE, 1.0) ).xyz;

  vNormal = vec4( rotation3d( axis, angle ) * vec4(normal, 1.0) ).xyz;
  float xSide = forceX * speedX * (0.1 + timer);
  // float xSide = (rd() - 0.5) * 0.1 + forceX * speedX * (0.1 + timer);
  // float ySide = forceY * easeTimer * speedY - cubicIn((rd() * 0.4 + timer * 1.7) / LOOP);
  float ySide = forceY * speedY * (0.1 + timer) - cubicIn((rd() * 0.4 + timer * 2.0) / LOOP);

  vec3 disp = vec3( xSide + sin( datangle * 0.1 + timer) * ((timer + 0.5) * 0.2) * rd(), ySide , 0.0);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position + (disp * 2.0), 1.0);


  alpha = smoothstep(LOOP, LOOP - 1.0, timer * 1.6);


}
