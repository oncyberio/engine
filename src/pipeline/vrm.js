// plugins //

import FadeAndFakeLightPlugin from "engine/libraries/visuals/fadeandfakelight/index.js";

import FadePlugin from "engine/libraries/visuals/fade/index.js";

import InstanceOpacityPlugin from 'engine/libraries/visuals/instanceopacity';


// == << 




// Basic materials

import { MeshBasicMaterial }    from "engine/xtend";

import Lambert                  from 'engine/materials/lambert'

import MeshToonMaterial         from 'engine/materials/toon'

import OutlineMaterial          from 'engine/materials/outline'

import { GlitchBasic, GlitchLambert }       from 'engine/materials/glitch';

import { GhostBasic, GhostLambert }         from 'engine/materials/ghost';


// =<< 


// Instanced VRM Materials 

import VRMInstancedBasicMaterial         from './materials/vrm/basic.js'

import VRMInstancedOutlineMaterial       from './materials/vrm/outline.js'

import VRMInstancedLightingMaterial      from './materials/vrm/lighting.js'

import VRMInstancedToonMaterial          from './materials/vrm/toon.js'   

import VRMInstancedhadowMaterial        from './materials/vrm/shadow.js'

import VRMInstancedcclusionMaterial    from './materials/vrm/occlusion.js'

import VRMInstancedGlitchBasic         from './materials/vrm/glitch.js'

import VRMInstancedGhostBasic          from './materials/vrm/ghost.js'



//



import PipeLineMesh         from "engine/abstract/pipelinemesh";

import PipeLineSkinnedMesh  from "engine/abstract/pipelineskinnedmesh";

import { RENDER_MODES }     from "./constants";

import { CAMERA_LAYERS } from "engine/constants";



const fadePlugin = new FadePlugin();

const instanceOpacityPlugin = new InstanceOpacityPlugin()



class VRMPipeline {

    // assign for VRMS  

    get( mesh, geometry, originalMaterial, opts ){

        var newMesh = mesh;

        if( opts.instance ){

            return this.assignVRMInstance(newMesh, geometry, originalMaterial, opts);

        } else {

            return this.assignVRMDefault(newMesh, geometry, originalMaterial, opts);
        }

    }

    // assign instance vrm 

    assignVRMInstance(mesh, geometry, originalMaterial, opts){

        var storePlugins = opts.plugins

        opts.plugins = [...opts.plugins]

        opts.plugins.push(instanceOpacityPlugin)
        
        var newMesh = mesh;

        originalMaterial.transparent = true

        if( originalMaterial.side == 1 ){

            originalMaterial.side = 0
        }
      
        originalMaterial.depthTest = true 
        originalMaterial.depthWrite = true

      
        // diffuse material

        var diffuseMaterial = new VRMInstancedBasicMaterial( opts );

        diffuseMaterial.copy(originalMaterial);

        diffuseMaterial.transparent = true

        var occlusionMaterial = new VRMInstancedcclusionMaterial( opts )


        switch(opts.renderMode){


          
            case RENDER_MODES.GHOST:
            case RENDER_MODES.ERROR:
    
                    // override transparency sorting 
    
                geometry.transparencySorting = true

                const parameters = {

                    uniforms: {
                        rimPower: { value:  opts.renderMode == RENDER_MODES.ERROR ? 0.5 : 1.0 },
                        minAlpha : { value: opts.renderMode == RENDER_MODES.ERROR ? 0.2 : 0.05}
                    }
                }


                diffuseMaterial  = new VRMInstancedGhostBasic(opts,parameters)

                diffuseMaterial.copy(originalMaterial)

                lightingMaterial = new VRMInstancedGhostBasic(opts,parameters)

                lightingMaterial.copy(originalMaterial)

                if( opts.renderMode == RENDER_MODES.ERROR ) {

                    diffuseMaterial.color.setHex(0xff0000)
                    lightingMaterial.color.setHex(0xff0000)
                }

                diffuseMaterial.transparent = true
                lightingMaterial.transparent = true
                diffuseMaterial.side = 0
                lightingMaterial.side = 0

            break;


            case RENDER_MODES.GLITCH:

                diffuseMaterial  = new VRMInstancedGlitchBasic(opts)
                diffuseMaterial.copy(originalMaterial)

                lightingMaterial = new VRMInstancedGlitchBasic(opts)
                lightingMaterial.copy(originalMaterial)

                diffuseMaterial.transparent  = true

                lightingMaterial.transparent = true

                occlusionMaterial = new VRMInstancedGlitchBasic(opts)
                occlusionMaterial.copy(originalMaterial)

                occlusionMaterial.transparent = true
        
                break;


            // Multi render 

            case RENDER_MODES.TOON:

                var lightingMaterial = new VRMInstancedToonMaterial(opts)

                lightingMaterial.copy(originalMaterial)

                lightingMaterial.transparent = true

                var outLineMaterial = new VRMInstancedOutlineMaterial(opts)

                outLineMaterial.transparent = true

                diffuseMaterial = [
                    lightingMaterial,
                    outLineMaterial
                ]
                
                lightingMaterial = [ 
                    lightingMaterial, 
                    outLineMaterial
                ]

                break;

            default:

                var lightingMaterial = new VRMInstancedLightingMaterial( opts)

                lightingMaterial.copy(originalMaterial)

                lightingMaterial.envMapIntensity    = 0
                
                lightingMaterial.roughness          = 1

                lightingMaterial.metalness          = 0

                break;
        }

        var MeshConstructor = PipeLineMesh;

        if( !(newMesh instanceof MeshConstructor) ){
            
            newMesh = new MeshConstructor(geometry, diffuseMaterial, {
                visibleOnDiffuse: opts.pipelineOptions.visibleOnDiffuse,
                visibleOnOcclusion: opts.pipelineOptions.visibleOnOcclusion,
                visibleOnMirror: opts.pipelineOptions.visibleOnMirror,
                occlusionMaterial: occlusionMaterial,
                lightingMaterial: lightingMaterial,
                lightingOcclusionMaterial: occlusionMaterial
            })
        }
        else {

            console.log(' recompute' )
            console.log( 'already is a mesh pipeline')
        }
        
        const geo = newMesh.geometry

        switch(opts.renderMode){

            // setup multi render 

            case RENDER_MODES.TOON:

                newMesh.geometry.groups = [

                    { start: 0, count: geo.index.count, materialIndex: 0 },
                    { start: 0, count: geo.index.count, materialIndex: 1 }
                ]
               
                break;
           
            default:

                newMesh.geometry.groups = []
                
                break;
        }

        newMesh.customDepthMaterial = new VRMInstancedhadowMaterial(opts)

        newMesh.receiveShadow = true;

        newMesh.castShadow = true;

        newMesh.matrixAutoUpdate = false;

        newMesh.matrixWorldAutoUpdate = false;

        newMesh.layers.disableAll()
        
        newMesh.layers.set( CAMERA_LAYERS.DYNAMIC )

        newMesh.frustumCulled = false

        // set vrm after 0 
        newMesh.renderOrder = -0.01

        newMesh.matrixWorldAutoUpdate = false

        opts.plugins = storePlugins

        return newMesh
    }

    // assign default vrm

    assignVRMDefault(mesh, geometry, originalMaterial, opts){

        originalMaterial.transparent = true 

        var newMesh = mesh;

        if( originalMaterial.side == 1 ){

            originalMaterial.side = 0
        }
      
        originalMaterial.depthTest = true 
        originalMaterial.depthWrite = true

        // diffuse material

        var diffuseMaterial = new MeshBasicMaterial({  shadowSide: 2,plugins : [...opts.plugins, new FadeAndFakeLightPlugin()]});

        diffuseMaterial.copy(originalMaterial)

        diffuseMaterial.copy(originalMaterial)
        // lighting material

        switch(opts.renderMode){


            case RENDER_MODES.GLITCH:

                diffuseMaterial  = new GlitchBasic()
                diffuseMaterial.copy(originalMaterial)

                lightingMaterial = new GlitchLambert()
                lightingMaterial.copy(originalMaterial)
        
            break;


            case RENDER_MODES.GHOST:
            case RENDER_MODES.ERROR:
    
                    // override transparency sorting 
    
    
                    const parameters = {
    
                        uniforms: {
                            rimPower: { value:  opts.renderMode == RENDER_MODES.ERROR ? 0.5 : 1.0 },
                            minAlpha : { value: opts.renderMode == RENDER_MODES.ERROR ? 0.2 : 0.05}
                        }
                    }
    
    
                    diffuseMaterial  = new GhostBasic(parameters)
    
                    diffuseMaterial.copy(originalMaterial)
    
                    lightingMaterial = new GhostLambert(parameters)
    
                    lightingMaterial.copy(originalMaterial)
    
                    if( opts.renderMode == RENDER_MODES.ERROR ) {
    
                        diffuseMaterial.color.setHex(0xff0000)
                        lightingMaterial.color.setHex(0xff0000)
                    }
    
                    diffuseMaterial.transparent = true
                    lightingMaterial.transparent = true
    
                    diffuseMaterial.side = 0
                    lightingMaterial.side = 0
                
                break;


            // Multi render 

            case RENDER_MODES.TOON:

                
                var toonMaterial = new MeshToonMaterial( {  shadowSide: 2, plugins : [...opts.plugins, fadePlugin]});

                toonMaterial.copy(originalMaterial)
        
                toonMaterial.depthTest  = true

                toonMaterial.depthWrite = true

                toonMaterial.fog        = true


                var outLineMaterial = new OutlineMaterial({plugins : [...opts.plugins, fadePlugin]})

                toonMaterial.transparent = true
                outLineMaterial.transparent = true

                diffuseMaterial = [
                    toonMaterial,
                    outLineMaterial
                ]
                
                lightingMaterial = [ 
                    toonMaterial, 
                    outLineMaterial
                ]

                break;

            default:

                var lightingMaterial = new Lambert( {  shadowSide: 2, plugins : [...opts.plugins, fadePlugin]});

                lightingMaterial.fog = true

                lightingMaterial.copy(originalMaterial)
        
                lightingMaterial.depthTest  = true
        
                lightingMaterial.depthWrite = true

                break;
        }


        var MeshConstructor = opts.skinning == true ? PipeLineSkinnedMesh : PipeLineMesh;

        if( !(newMesh instanceof MeshConstructor) ){

            const occlusionMaterial = new MeshBasicMaterial({color: 0x000000})

            newMesh = new MeshConstructor(geometry, diffuseMaterial, {
                visibleOnDiffuse: opts.pipelineOptions.visibleOnDiffuse,
                visibleOnOcclusion: opts.pipelineOptions.visibleOnOcclusion,
                visibleOnMirror: opts.pipelineOptions.visibleOnMirror,
                occlusionMaterial: occlusionMaterial,
                lightingMaterial: lightingMaterial,
                lightingOcclusionMaterial: occlusionMaterial
                
            })
        }
        else {

            console.log(' recompute' )
            console.log('already is a mesh pipeline')
        }
        
        const geo = newMesh.geometry

        switch(opts.renderMode){

            // setup multi render 

            case RENDER_MODES.TOON:

                newMesh.geometry.groups = [

                    { start: 0, count: geo.index.count, materialIndex: 0 },
                    { start: 0, count: geo.index.count, materialIndex: 1 }
                ]
               
                break;
           
            default:

                newMesh.geometry.groups = []
                
                break;
        }


        return newMesh
    }
}

export default new VRMPipeline();