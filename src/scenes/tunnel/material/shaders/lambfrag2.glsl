#define LAMBERT

uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;

uniform sampler2D gradMap;

#define LEGACY_LIGHTS

#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>

uniform vec2 mouse;

#define e 0.001

vec3 getPosition( vec3 pos ){

	return  pos + vec3(mouse.x * 12.0, mouse.y * 12.0, 0.0) * smoothstep(LENGTH * 0.3, 0.0,  distance( ((LENGTH ) * ( 0.3)), pos.z  ) );
}

vec3 getPositionFromUv( vec2 uv ){

	vec2 datUv = uv;

	highp float angle = (2.0 * PI * datUv.x);

	highp float x =  RADIUS * cos(angle); // Calculate the X coordinate
	highp float y  = RADIUS * sin(angle); 

	highp vec3 pos = vec3(x, y, ( datUv.y ) );

	return getPosition( pos );

}


uniform bool receiveShadow;
uniform vec3 ambientLightColor;

#if defined( USE_LIGHT_PROBES )

	uniform vec3 lightProbe[ 9 ];

#endif

// get the irradiance (radiance convolved with cosine lobe) at the point 'normal' on the unit sphere
// source: https://graphics.stanford.edu/papers/envmap/envmap.pdf
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {

	// normal is assumed to have unit length

	float x = normal.x, y = normal.y, z = normal.z;

	// band 0
	vec3 result = shCoefficients[ 0 ] * 0.886227;

	// band 1
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;

	// band 2
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );

	return result;

}

vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {

	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );

	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );

	return irradiance;

}

vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {

	vec3 irradiance = ambientLightColor;

	return irradiance;

}

float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {

	#if defined ( LEGACY_LIGHTS )

		if ( cutoffDistance > 0.0 && decayExponent > 0.0 ) {

			return pow( saturate( - lightDistance / cutoffDistance + 1.0 ), decayExponent );

		}

		return 1.0;

	#else

		// based upon Frostbite 3 Moving to Physically-based Rendering
		// page 32, equation 26: E[window1]
		// https://seblagarde.files.wordpress.com/2015/07/course_notes_moving_frostbite_to_pbr_v32.pdf
		float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );

		if ( cutoffDistance > 0.0 ) {

			distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );

		}

		return distanceFalloff;

	#endif

}

float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {

	return smoothstep( coneCosine, penumbraCosine, angleCosine );

}

#if NUM_DIR_LIGHTS > 0

	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};

	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];

	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {

		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;

	}

#endif


#if NUM_POINT_LIGHTS > 0

	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};

	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];

	// light is an out parameter as having it as a return value caused compiler errors on some devices
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {

		vec3 lVector = getPosition(pointLight.position) - geometryPosition;

		light.direction = normalize( lVector );

		float lightDistance = length( lVector );

		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );

	}

	
#endif


#if NUM_SPOT_LIGHTS > 0

	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};

	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];

	// light is an out parameter as having it as a return value caused compiler errors on some devices
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {

		vec3 lVector = spotLight.position - geometryPosition;

		light.direction = normalize( lVector );

		float angleCos = dot( light.direction, spotLight.direction );

		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );

		if ( spotAttenuation > 0.0 ) {

			float lightDistance = length( lVector );

			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );

		} else {

			light.color = vec3( 0.0 );
			light.visible = false;

		}

	}

#endif


#if NUM_RECT_AREA_LIGHTS > 0

	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};

	// Pre-computed values of LinearTransformedCosine approximation of BRDF
	// BRDF approximation Texture is 64x64
	uniform sampler2D ltc_1; // RGBA Float
	uniform sampler2D ltc_2; // RGBA Float

	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];

#endif


#if NUM_HEMI_LIGHTS > 0

	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};

	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];

	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {

		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;

		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );

		return irradiance;

	}

#endif
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

uniform float desactivated;

uniform float timer;

varying vec2 vvUv;

varying vec3 vPosition;

varying vec2 initialUV;

varying vec3 vworldPosition;


vec3 getAverageNormal(vec2 _uvvv){

  vec3  dx = 

        (  getPositionFromUv( _uvvv + vec2( e, 0.)) ) 
            - 
        (  getPositionFromUv( _uvvv + vec2(-e, 0.)) );

  vec3  dy = 
        (  getPositionFromUv( _uvvv + vec2(0.,  e)) )  
            - 
        (  getPositionFromUv( _uvvv + vec2(0., -e)) );
    
  vec3 norm =  cross(normalize(dx), normalize(dy));

 
  return norm;

}

float czm_luminance(vec3 rgb)
{
    // Algorithm from Chapter 10 of Graphics Shaders.
    const vec3 W = vec3(0.2125, 0.7154, 0.0721);
    return dot(rgb, W);
}

uniform mat3 normalMatrix;

float when_gt(float x, float y) {
  return max(sign(x - y), 0.0);
}

float random (vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

float cubicInOut(float t) {
  return t < 0.5
    ? 4.0 * t * t * t
    : 0.5 * pow(2.0 * t - 2.0, 3.0) + 1.0;
}


// #define SPEED 0.1

void main() {

	
	vec3 mapN2 = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	
	float diff = (smoothstep( 0.0, 0.3, distance(initialUV.y, desactivated ) ) - 0.15 + abs(mapN2.r) * 0.3) * when_gt(desactivated, initialUV.y );


	if( initialUV.y > diff ){

		discard;
	}

	vec2 normalUv = vec2(  vNormalMapUv.x * 4.0, mod( vNormalMapUv.y + timer * SPEED * 1.25 , 1.0 ) );

	vec3 mapN = texture2D( normalMap, normalUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;

	vec3 vNormal = normalize(  getAverageNormal(initialUV) );

	const float uvYScale = 5.0;

	float rd = random( floor( vec2(initialUV.x * 100.0, mod( initialUV.y, 0.0) )));
	vec2 st = vec2( initialUV.x * 50.0, (initialUV.y + rd + timer * SPEED * 0.5) * uvYScale ); // Scale the coordinate system by 10
    vec2 ipos = floor(st);  // get the integer coords


	float rd2 = random( floor( vec2(initialUV.x * 2.0, mod( initialUV.y, 0.0) )));
	vec2 st2 = vec2( initialUV.x * 2.0, (initialUV.y + rd + timer * SPEED * 0.25) * uvYScale ); // Scale the coordinate system by 10
    vec2 ipos2 = floor(st2);  // get the integer coords


	float xxx =  smoothstep(0.4, 1.0, random( ipos + ipos2 ));


	//  vec4 c[4];
    //         c[0] = vec4(0.0, 0.0, 0.0, 0.0);
    //         c[1] = vec4(0.11,0.318,0.635, 0.33);
    //         c[2] = vec4(0.953,0.98,0.863, 0.66);
    //         c[3] = vec4(.941,0.306,0.753, 1.0);

	

	// if (intensity > 0.95)
	// 	ccc = vec3(1.0,0.5,0.5);
	// else if (intensity > 0.65)
	// 	ccc = vec3(0.6,0.3,0.3);
	// else if (intensity > 0.35)
	// 	ccc = vec3(0.4,0.2,0.2);
	// else
		// ccc = vec3(0.0,0.0,0.0);

	//
	// gl_FragColor.rgb = vec3(xxx,xxx,xxx);

	// float lll = vec3(xxx);
	
	// gl_FragColor.rgb  = vec3(xxx);

	// float intensity = xxx; 

	vec3 cxc = texture2D( gradMap,  vec2( cubicInOut(xxx), 0.5) ).rgb  ;
	// vec3 cxc = vec3( cubicInOut(xxx) );

	vec4 diffuseColor = vec4( cxc, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;

	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>

	tbn = getTangentFrame( - vViewPosition, vNormal, vNormalMapUv );

	normal = -normalize( tbn * mapN );
	

	#include <emissivemap_fragment>

	// accumulation
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>

	// modulation
	#include <aomap_fragment>

	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance ;


	#include <envmap_fragment>
	#include <opaque_fragment>

	float gridForce = smoothstep(0.0, 0.9, czm_luminance(gl_FragColor.rgb)); 
	
	vec2 coord = vec2( mod( vvUv.y + timer * SPEED, 1.0) , vvUv.x) * vec2(LENGTH * 0.1, 4.0) * 0.5;

	vec2 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord) * 0.5;
	float line = min(grid.x, grid.y);
	float gColor =  (1.0 - min(line, 1.0)) * (1.0 - smoothstep(0.0, 50.0, vViewPosition.z ));

	vec3 viewWorldDir = normalize(vworldPosition - cameraPosition);

	float NdotV = max(dot(viewWorldDir, normal), 0.0);

	float fresnelFactor =  1.0 - pow(1.0 - NdotV, 4.0);

	float far = smoothstep(0.0, 50.0, vViewPosition.z );


	float v2mix = min(fresnelFactor, far);


	gl_FragColor.rgb = 
		gl_FragColor.rgb * vec3(1.0 - v2mix) + 
		vec3(gColor * (1.0 -gridForce) * viewWorldDir.r * viewWorldDir.r ) 
			* smoothstep(0.5, 1.0, sin(3.1416 * mod(timer * 0.05 + 2.1, 1.0) ) );




	#include <tonemapping_fragment>
	#include <colorspace_fragment>

}