varying vec2 vUv;
uniform vec3 floor;
uniform vec3 wall;
uniform vec3 top;
uniform vec3 horizon;
uniform float timer;
uniform float DPI;


#define MAX_PIXEL_MIX 0.01

float nrand( vec2 n )
{
	return fract(sin(dot(n.xy, vec2(12.9898, 78.233)))* 43758.5453);
}

float n4rand( vec2 n )
{
	float t = fract( timer );
	float nrnd0 = nrand( n + 0.07*t );
	float nrnd1 = nrand( n + 0.11*t );	
	float nrnd2 = nrand( n + 0.13*t );
	float nrnd3 = nrand( n + 0.17*t );
	return (nrnd0+nrnd1+nrnd2+nrnd3) / 4.0;
}
	
float getnoise(vec2 uv){
	return n4rand( uv );
}


uniform float step1;

uniform float step2;

uniform float step3;

uniform float step4;



varying vec2 ssp;
	



vec4 getColor(float y, float sstep, float sstep2){

	vec3 color = mix(top,   wall   , smoothstep(step1, sstep , y));
		 color = mix(color, horizon, smoothstep(sstep, sstep2, y));
	return vec4( mix(color, floor, smoothstep(sstep2, step4, y)), 1.0);

}

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



void main()

{	

	vec2 screenCoords = (gl_FragCoord.xy / gl_FragCoord.w) * 0.5 + 0.5;


	float rnd = getnoise(screenCoords);

	float perturbedFragCoordY = vUv.y + rnd * MAX_PIXEL_MIX * DPI;
	
	// vec4 diffuse    = getColor(perturbedFragCoordY, step2, step3);

	  vec4 c[4];// Array length isn't 0 inclusive :(
        c[0] = vec4(floor, step1);
        c[1] = vec4(horizon, step2);
        c[2] = vec4(wall, step3);
        c[3] = vec4(top, step4);
		vec3 diffuse = gradientmap(c,  perturbedFragCoordY);

	gl_FragColor = vec4(diffuse, 1.0);

	//gl_FragColor.rgb += rnd * MAX_PIXEL_MIX * DPI * 3.0;

     #include <colorspace_fragment>
	
}
