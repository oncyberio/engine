const DEFAULT_OPTS = {

    instance      : false,
    isVRM         : false,
    renderMode    : 'default',
    enableRealTimeShadow : false,
    skinning      : false,
    plugins       : [],
    pipelineOptions : {
        visibleOnOcclusion: true,
        visibleOnMirror: true,
        visibleOnDiffuse: true
    },
    envmapIntensity: 1.0,
    useTransparency : true
}

import VRMPipeline from './vrm.js'

import ModelPipeline from './model.js'


class Pipeline {

    getUniqueString( data = {} ){

        var opts = Object.assign({}, DEFAULT_OPTS, data);

        var str = ''
        
        for( var key in opts ){
                
            str += key + opts[key];
        }

        return str
    }
    
    get(mesh, geometry, originalMaterial, data = {}){


        var opts = Object.assign({}, DEFAULT_OPTS, data);

        var newMesh; 

        if( opts.isVRM ){

            newMesh = VRMPipeline.get(mesh, geometry, originalMaterial, opts);

        } else {

            newMesh = ModelPipeline.get(mesh, geometry, originalMaterial, opts);
        }

        newMesh.userData.pipelineOptions = opts;
        newMesh.userData.originalMaterial = originalMaterial;

      

        return newMesh 
    }

    update(mesh, data = {}){

        var opts = Object.assign({}, mesh.userData.pipelineOptions, data);

        if( opts.isVRM ){

            VRMPipeline.update(mesh, opts);

        } else {

            ModelPipeline.update(mesh, opts);
        }

        newMesh.userData.pipelineOptions = opts;
    }

}

export default new Pipeline();