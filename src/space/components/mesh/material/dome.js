import { ShaderMaterial, Color, Vector3, TextureLoader, RepeatWrapping, UniformsUtils, UniformsLib, Texture } from 'three'

import Emitter from 'engine/events/emitter'

import Events from 'engine/events/events'

import {

    IS_EDIT_MODE

} from 'engine/constants'

export default class DomeMaterial extends ShaderMaterial {

    constructor(){

    
        let opts= {

            vertexShader: `

                varying vec3 worldPosition;

                varying vec3 vNormal;

                varying vec2 vUv;
              
                void main() {

                    vNormal = normal;

                    vUv = uv;

                    worldPosition =  (modelMatrix * vec4( position, 1.0 )).xyz;

                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

                }
            `, 

            fragmentShader: `

                varying vec3 vNormal;
                
                #ifdef FLAT_TOP_HEXAGON
                const vec2 s = vec2(1.7320508, 1);
                #else
                const vec2 s = vec2(1, 1.7320508);
                #endif

                float hash21(vec2 p)
                {
                    return fract(sin(dot(p, vec2(141.13, 289.97)))*43758.5453);
                }

            
                float hex(in vec2 p)
                {    
                    p = abs(p);
                    
                    #ifdef FLAT_TOP_HEXAGON
                    return max(dot(p, s*.5), p.y); // Hexagon.
                    #else
                    return max(dot(p, s*.5), p.x); // Hexagon.
                    #endif    
                }

                vec4 getHex(vec2 p)
                {    
                  
                    
                    #ifdef FLAT_TOP_HEXAGON
                    vec4 hC = floor(vec4(p, p - vec2(1, .5))/s.xyxy) + .5;
                    #else
                    vec4 hC = floor(vec4(p, p - vec2(.5, 1))/s.xyxy) + .5;
                    #endif
                    
                    // Centering the coordinates with the hexagon centers above.
                    vec4 h = vec4(p - hC.xy*s, p - (hC.zw + .5)*s);
                    
                    
                 
                    return dot(h.xy, h.xy) < dot(h.zw, h.zw) 
                        ? vec4(h.xy, hC.xy) 
                        : vec4(h.zw, hC.zw + .5);
                }

            
                varying vec2 vUv;

                uniform vec3 color;

                uniform vec3 target;

                varying vec3 worldPosition;

                void main() {   

                    vec4 c = getHex(vec2(vUv.x * 150.0, vUv.y * 40.0) * 2.0);

                    #ifdef IS_EDIT_MODE 


                        float eDist = hex(c.xy);

                        vec3 col = mix(vec3(1.), vec3(0), smoothstep(0., .03, eDist - .5 + .04));    

                        // vec3 aa = vec3(vNormal * 2.0 - 1.0);

                        float inside = col.r;

                        vec4 cc = mix( vec4(vNormal, 1.0), vec4(1.0, 1.0, 1.0, 0.1), inside);

                        cc.a *= 0.2;

                        gl_FragColor = cc;

                    #else

                        float a = smoothstep( 12.0, 0.0, distance(target, worldPosition) );

                        float eDist = hex(c.xy);

                        vec3 col = mix(vec3(1.), vec3(0), smoothstep(0., .03, eDist - .5 + .04));    

                        // vec3 aa = vec3(vNormal * 2.0 - 1.0);

                        float inside = col.r;

                        vec4 cc = mix( vec4(1.0, 1.0, 1.0, 1.0), vec4(1.0, 1.0, 1.0, 0.1), inside);

                        cc *= a;

                        gl_FragColor = cc;

                    #endif
                   
                   
                   
                }
      
            `,
            uniforms : {

                target: {

                    value: new Vector3()
                }
            },

            alphaTest: 0.1,
            transparent: true, 
            side: 2,
            defines: {}
        }
        
        if( IS_EDIT_MODE ) {

            opts.defines["IS_EDIT_MODE"] = 1
        }

        super( opts )
    }

    set target( val ){

        this.uniforms.target.value =  val 
    }

    get target(){

        return this.uniforms.target.value
    }
    // update(delta){

    //     this.uniforms.uTime.value += delta
    // }

    // addEvents(){

    //     if( this.updateEvent == null ){

    //         this.updateEvent = this.update.bind(this)
    //     }

    //     Emitter.on( Events.PRE_UPDATE, this.updateEvent)
    // }

    // removeEvents(){
    
    //     if( this.updateEvent != null ){

    //         Emitter.off(Events.PRE_UPDATE , this.updateEvent )

    //         this.updateEvent = null
    //     }
    // }

    dispose(){

        // this.removeEvents()
        super.dispose()

    }

}

		