#ifdef USE_MAP

	uniform sampler2D map;

	uniform float edgeTransition;
  uniform float noTileDisplacement;
  uniform sampler2D noiseMap;
  uniform sampler2D sideMap;

  uniform float smoothAngle;

  varying vec3 datNormal;

	varying vec3 datWorldPosition;

#endif

varying vec3 originalNormal;

vec4 triplanar( sampler2D s, vec3 p, vec3 n, float k )
{
    // project+fetch
	vec4 x = texture2D( s, p.yz );
	vec4 y = texture2D( s, p.zx );
	vec4 z = texture2D( s, p.xy );
    
    // and blend
    vec3 m = pow( abs(n), vec3(k) );
	return (x*m.x + y*m.y + z*m.z) / (m.x + m.y + m.z);
}

#define HASHSCALE1 443.8975
float rand2(vec2 p) {
  vec3 p3  = fract(vec3(p.xyx) * HASHSCALE1);
  p3 += dot(p3, p3.yzx + 19.19);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p){
  vec2 ip = floor(p);
  vec2 u = fract(p);
  u = u*u*(3.0-2.0*u);
  
  float res = mix(
    mix(rand2(ip),rand2(ip+vec2(1.0,0.0)),u.x),
    mix(rand2(ip+vec2(0.0,1.0)),rand2(ip+vec2(1.0,1.0)),u.x),u.y);
  //return res*res;
    return res;
}

#define USE_HASH

float sum( vec3 v ) { 
  return v.x+v.y+v.z;
}

float sum( vec4 v ) { 
  return v.x+v.y+v.z;
}



vec3 textureNoTile( sampler2D tex, vec2 x, float force  )
{
    #ifndef USE_HASH
      float k = texture( noiseMap, 0.005*x ).x; // cheap (cache friendly) lookup
    #else
      float k = noise(x);
    #endif

    vec2 duvdx = dFdx( x );
    vec2 duvdy = dFdy( x );
    
    float l = k*8.0;
    float i = floor( l );
    float f = fract( l );
    
    vec2 offa = sin(vec2(3.0,7.0)*(i+0.0)); // can replace with any other hash
    vec2 offb = sin(vec2(3.0,7.0)*(i+1.0)); // can replace with any other hash

    vec3 cola = texture( tex, vec2(x.xy + offa) ).xyz;
    vec3 colb = texture( tex, vec2(x.xy + offb) ).xyz;
    
    return mix( cola, colb, smoothstep(0.2,0.8,f-0.1*
    sum(cola-colb) ));
}
 // ( mapTransform * vec3( MAP_UV, 1 ) ).xy

vec4 sampleBip( sampler2D m, vec3 p, vec3 dpdx, vec3 dpdy, ivec3 ma, ivec3 me, vec3 n, float k, vec2 offa, vec2 offb, float f){

  // project+fetch
  vec4 x1 = texture2D( m, vec2(   p[ma.y],   p[ma.z]) + offa );
  vec4 x2 = texture2D( m, vec2(   p[ma.y],   p[ma.z]) + offb );

  vec4 y1 = texture2D( m, vec2(   p[me.y],   p[me.z]) + offa );
  vec4 y2 = texture2D( m, vec2(   p[me.y],   p[me.z]) + offb );
  
  vec4 x = mix( x1, x2, smoothstep(0.2,0.8,f-0.1*
      sum(x1-x2) ));

  vec4 y = mix( y1, y2, smoothstep(0.2,0.8,f-0.1*
      sum(x1-x2) ));
  // return x;
  
  // blend factors
  vec2 w = vec2(n[ma.x],n[me.x]);
  // make local support
  // w = clamp( (w-0.5773)/(1.0-0.5773), 0.0, 1.0 );
  // shape transition
  w = pow( w, vec2(k/8.0) );
  // blend and return
  return (x*w.x + y*w.y) / (w.x + w.y);
}

vec4 biplanar( vec3 p, vec3 n, float k, vec2 texcoord, vec3 wn )
{ 
    // vec3 wn = n;
    // grab coord derivatives for texturing
    vec3 dpdx = dFdx(p);
    vec3 dpdy = dFdy(p);
    n = abs(n);

    // determine major axis (in x; yz are following axis)
    ivec3 ma = (n.x>n.y && n.x>n.z) ? ivec3(0,1,2) :
               (n.y>n.z)            ? ivec3(1,2,0) :
                                      ivec3(2,0,1) ;
    // determine minor axis (in x; yz are following axis)
    ivec3 mi = (n.x<n.y && n.x<n.z) ? ivec3(0,1,2) :
               (n.y<n.z)            ? ivec3(1,2,0) :
                                      ivec3(2,0,1) ;
    // determine median axis (in x;  yz are following axis)
    ivec3 me = ivec3(3) - mi - ma;

    vec2 tt = texcoord;

    #ifndef USE_HASH
      float k2 = texture( noiseMap,tt * 0.005 ).x; // cheap (cache friendly) lookup
    #else
      float k2 = noise(tt);
    #endif
    
    float l = k2*8.0;
    float i = floor( l );
    float f = fract( l );


    float ia = floor(l+0.5); // suslik's method (see comments)
    float ib = floor(l);
    f = min(f, 1.0-f)*2.0;

    vec2 offa = noTileDisplacement * sin(vec2(3.0,7.0)*ia); // can replace with any other hash
    vec2 offb = noTileDisplacement * sin(vec2(3.0,7.0)*ib); // can replace with any other hash
    
   // vec2 offa =  noTileDisplacement * sin(vec2(3.0,7.0)*(i+0.0)); // can replace with any other hash
   // vec2 offb =  noTileDisplacement * sin(vec2(3.0,7.0)*(i+1.0)); // can replace with any other hash

   // vec2 offs =mix( offa, offb, smoothstep(0.2,0.8,f-0.1));

    vec4 sampleA = sampleBip( map, p, dpdx, dpdy, ma, me, n, k, offa, offb, f);

    float smoothCalc = smoothstep(smoothAngle, smoothAngle + 0.5, wn.y );


    vec4 sampleB = sampleBip( sideMap, p, dpdx, dpdy, ma, me, n, k, offa, offb, f);

    return mix(sampleB, sampleA,  smoothCalc );

   

    // return sampleA;

   

}