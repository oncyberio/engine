varying vec2 vUv;

#define GRAD 4

vec3 gradientmap(vec4 c[GRAD], float l){

  vec3 r;
  for(int i = 0; i <= GRAD; i++) {
      if (i == GRAD) { 
          r = c[i-1].rgb; 
          break;
      } else if (l < c[i].a) { 
          if (i == 0) { 
              r = c[i].rgb; 
              break;
          } else { 
              
              r = mix( c[i-1].rgb, c[i].rgb, (l - c[i-1].a)/(c[i].a - c[i-1].a));
              break;
          }
      }
  }

  return r;

}

void main() {

  vec4 base = vec4(1.0);

    vec4 c[GRAD];
        c[0] = vec4(0.0, 0.0, 0.0, 0.0);
        c[1] = vec4(0.11,0.318,0.635, 0.33);
        c[2] = vec4(0.953,0.98,0.863, 0.66);
        c[3] = vec4(.941,0.306,0.753, 1.0);


  base.rgb = gradientmap(c, vUv.x).rgb;

  gl_FragColor = base;

}  
