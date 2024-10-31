varying vec4 localmvPosition;

vec3 fade(vec3 level, vec3 pos, float dist) {

    vec3 halfLevel = level * 0.5;

    return step(dist * 1.01, (abs(mod(pos, level) - halfLevel) / halfLevel));

}

#ifdef USE_NORMAL

    varying vec3 finalNormal;

#endif


uniform float 		glitchTimer;

varying float 		nShiftPower;

varying float 		vScanSize;

uniform float 		texture_ratio;

varying vec2 vUv;

varying vec2 vPosUv;


#define GRID_SIZE 50.0

vec3 when_gt(vec3 x, vec3 y) {
  return max(sign(x - y), 0.0);
}

float when_gt(float x, float y) {
  return max(sign(x - y), 0.0);
}

vec3 rgbShift(vec2 uv, sampler2D datMap){


	float timer = glitchTimer;

	float d1 = nShiftPower * 0.002;
	float d2 = nShiftPower * 0.004;

	vec2 q   = uv * texture_ratio;

	lowp vec3 col;	

	float x =  nShiftPower * sin(0.3*timer+q.y*21.0)*sin(0.7*timer+q.y*29.0)*sin(0.3+0.33*timer+q.y*31.0)*0.0017;

	col.r = texture2D(datMap,vec2(x + uv.x+ d1 ,uv.y+ d1)).x+0.05;
	col.g = texture2D(datMap,vec2(x + uv.x  ,uv.y- d2)).y+0.05;
	col.b = texture2D(datMap,vec2(x + uv.x- d2 ,uv.y    )).z+0.05;

	float nshiftQuater = nShiftPower * 0.75;
	
	col.r += 0.08*texture2D(datMap,nshiftQuater*vec2(x+0.025, -0.027)+ nShiftPower * vec2(uv.x+0.001,uv.y+0.001)).x;
	col.g += 0.05*texture2D(datMap,nshiftQuater*vec2(x-0.022, -0.02) + nShiftPower * vec2(uv.x+0.000,uv.y-0.002)).y;
	col.b += 0.08*texture2D(datMap,nshiftQuater*vec2(x-0.02, -0.018) + nShiftPower * vec2(uv.x-0.002,uv.y+0.000)).z;

		
	return col;
}

float scan(vec2 uv){

	vec2 q = uv * texture_ratio;

	float tt = 0.35+0.35*sin(3.5 * glitchTimer * 5.0 + vPosUv.y * GRID_SIZE );

	return  max(when_gt(tt, 0.1), 0.6);
}

vec3 grid(vec2 uv){

	float scanSize = vScanSize * GRID_SIZE;

	return when_gt(

		1.0-0.65*vec3(clamp((mod(vPosUv.x * scanSize , 2.0)-1.0)*2.0,0.0,1.0))

	, vec3(0.5));
	
}
