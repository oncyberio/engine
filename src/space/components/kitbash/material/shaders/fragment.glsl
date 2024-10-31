#ifdef USE_MAP
	
	uniform sampler2D map;

#endif

uniform vec3 color;

#ifndef OCCLUSION

    varying vec2 vUv;
    
    varying float height;

    varying float   vWorldPosition;

#endif

#ifdef ALPHA_TEST

    uniform float alphaTest;

#endif

#include <fog_pars_fragment>
 
void main() {

	gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);

    #ifdef OCCLUSION

    #else

        gl_FragColor = vec4(color, 1.0);

        #ifdef USE_MAP

            gl_FragColor = texture2D(map, vUv);

            #ifdef ALPHA_TEST

                if(gl_FragColor.a < alphaTest ) {

                    discard;
                }

            #endif

            #ifndef PREVIEW

                gl_FragColor.rgb    *= 0.3 * smoothstep(0.0, 3.0, vWorldPosition);

            #endif


        #else 

            gl_FragColor = vec4(color, 1.0);

        #endif

        #include <fog_fragment>

    #endif

   #include <colorspace_fragment>

   
   #ifdef OCCLUSION

        // gl_FragColor.rgb = vec3(0.0, 1.0, 0.0);

        // #ifdef USE_FOG

        //     gl_FragColor.rgb *= (1.0 - fogFactor);

        // #endif

   #endif



}
