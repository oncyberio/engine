import Renderer from 'engine/renderer'

import DynamicOctree from './octree.js'

var debugColor = false

const DISTANCES = [0, 150, 250]

export default class OctreeSorter {

    constructor( opts = {}){

        this.needsBuild = false

        this.options = opts

        this.debugMesh = null

        this.builtPromise = new Promise( (resolve, reject) => {

            this.builtResolve = resolve
        })

    }

    async getHelper(){
        
        await this.builtPromise

        if( this.debugMesh == null ) {

            this.debugMesh = this.octree.buildVisualRepresentation()
        }

        return this.debugMesh
    }

    build( geometry, wrappers ){

        if( this.octree == null && wrappers.length > 0 ) {
            
            var maxItems = 0
            // Define space for random bounding boxes
            this.octree = new DynamicOctree( 100 )  // capacity of 4 for this example
            
            let g = 0
            
            while( g < wrappers.length ) {

                wrappers[g].updateFromSource()

                if( wrappers[g].visible == true ) {

                    wrappers[g].boundingBox = wrappers[g].getBBox()

                    this.octree.insert(
        
                        wrappers[g].boundingBox, wrappers[g]
                    )

                    maxItems++
                }
             
                g++
            }

            this.octree.shrink()
    
            this.octree.expandOrShrinkRootAndAllDescendants()

            // if(  this.options.debug == true ){

            //     this.debugMesh = this.octree.buildVisualRepresentation()
            // }
    
            this.boxes = this.octree.getBoxesWithObjects()
    
            var validate = this.octree.validateChildInParentRecursively()
    
            if( validate  == false ) {
                debugger;
            } 

            let ppp = 0
            let countItems = 0
            while(ppp < this.boxes.length ) {
                countItems += this.boxes[ppp].objects.length
                ppp++
            }
            if( countItems != maxItems ){

                debugger;
            }
            
            var validateObjectContainement = this.octree.validateContainment()

    
            var ccc = 0

    
            for( const box of this.boxes ) {
    
                const objects = box.objects
    
                let localBuffers = {
    
                    offset: new Float32Array(new Array(3 * objects.length))
                }
    
                for ( const item in geometry.items ) {
    
                    var type = geometry.items[item].type
    
                    if (type == null) {
    
                        type = Float32Array
                    }
                    
                    localBuffers[item] = new type(new Array(geometry.items[item].length * objects.length))
                }
    
                var c = 0

                // debugger;
    
                for ( const index in box.objects ) {
    
                    const object = box.objects[index].data

                    localBuffers.offset[c * 3]     = object.position.x
                    localBuffers.offset[c * 3 + 1] = object.position.y
                    localBuffers.offset[c * 3 + 2] = object.position.z
    
                    localBuffers.rotation[c * 4]     = object.rotation[0]
                    localBuffers.rotation[c * 4 + 1] = object.rotation[1]
                    localBuffers.rotation[c * 4 + 2] = object.rotation[2]
                    localBuffers.rotation[c * 4 + 3] = object.rotation[3]
    
    
                    localBuffers.scale[c * 3]     = object.scale.x
                    localBuffers.scale[c * 3 + 1] = object.scale.y
                    localBuffers.scale[c * 3 + 2] = object.scale.z

                    if( localBuffers.aOpacity ){
                        localBuffers.aOpacity[c] = object.opacity
                    }

    
                    if( debugColor ) {
    
                        const g = Math.random() < 0.9 
                        localBuffers.debugcolor[c * 3]         = g ? 1.0 : 1.0
                        localBuffers.debugcolor[c * 3 +1 ]     = g ? 0.0 : 1.0
                        localBuffers.debugcolor[c * 3 +2 ]     = g ? 0.0 : 1.0
                    }
    
                    c++
                }
    
                box.bakedBuffers = localBuffers
    
                ccc += localBuffers.offset.length
                
            }

            this.needsBuild = false

            if( this.builtResolve ){

                this.builtResolve()
            }
        }
    }

    sort( geometry, wrappers, frustum, position){

        if( this.needsBuild  ){


            this.build( geometry, wrappers )
        }
    
        if( this.octree ) {
    
            var res; 
    
            if( Renderer.shadowMap.autoUpdate == false ) {
    
                res = this.octree.query(frustum, { distance: true, position: position, transparent: false });
    
            }
            else {
    
                res =  { boxes: this.boxes }
            }
    
            if(res.same == true) {
    
                return
            }
    
            if( res.boxes == null ) {
    
                debugger;
            }
    
            // reset counts 
    
            if( geometry.isLOD ){
    
                let h = 0
    
                while( h < geometry._lods.length ) {
                    
                    geometry._lods[h].currentOpacityIndex = 0
                    geometry._lods[h].currentOffsetIndex = 0
                    geometry._lods[h].currentRotationIndex = 0
                    geometry._lods[h].currentScaleIndex = 0
                    geometry._lods[h].currentColorDebugIndex = 0
                    geometry._lods[h]._maxInstanceCount = 0
                    
                    h++
                }
    
            }
    
            else {
                
                geometry.currentOpacityIndex = 0
                geometry.currentOffsetIndex = 0
                geometry.currentRotationIndex = 0
                geometry.currentScaleIndex = 0
                geometry.currentColorDebugIndex = 0
                geometry._maxInstanceCount = 0
            }
    
            let i = 0
    
            while( i < res.boxes.length ) {
    
                const bakedBuffersArrays = res.boxes[i].bakedBuffers
    
                var scope = geometry
    
                // deal with lod 
    
                if( geometry.isLOD && res.boxes[i].distance != null && Renderer.shadowMap.autoUpdate == false ){
                    
                    // console.log( res.boxes[i].distance < 200 ? 0 : 1  )
                    scope = geometry._lods[ this.findInterval( res.boxes[i].distance, DISTANCES ) ]
                }
    
                scope._maxInstanceCount += bakedBuffersArrays.offset.length / 3
    
                scope.attributes.offset.array.set(bakedBuffersArrays.offset, scope.currentOffsetIndex);
                scope.currentOffsetIndex += bakedBuffersArrays.offset.length;
        
                scope.attributes.rotation.array.set(bakedBuffersArrays.rotation, scope.currentRotationIndex);
                scope.currentRotationIndex += bakedBuffersArrays.rotation.length;
        
                scope.attributes.scale.array.set(bakedBuffersArrays.scale, scope.currentScaleIndex);
                scope.currentScaleIndex += bakedBuffersArrays.scale.length;

                if( scope.attributes.aOpacity){

                    scope.attributes.aOpacity.array.set(bakedBuffersArrays.aOpacity, scope.currentOpacityIndex);
                    scope.currentOpacityIndex += bakedBuffersArrays.aOpacity.length;
    
                }
    
                if( debugColor ) {
    
                    scope.attributes.debugcolor.array.set(bakedBuffersArrays.debugcolor, scope.currentColorDebugIndex);
                    scope.currentColorDebugIndex += bakedBuffersArrays.debugcolor.length;
                }
            
                
                i++
            }
          
            let h = 0
    
            let l = geometry.isLOD ? geometry._lods.length : 1
            
            while( h < l ) {
    
                const scope = geometry.isLOD ? geometry._lods[h] : geometry
    
                if ( scope._maxInstanceCount > 0  ) {
    
                    scope.attributes.offset._updateRange.count = scope._maxInstanceCount * scope.attributes.offset.itemSize
    
                    scope.attributes.offset.needsUpdate = true
    
                    for (const item in scope.items) {
    
                        scope.attributes[item]._updateRange.count = scope._maxInstanceCount * scope.attributes[item].itemSize
    
                        scope.attributes[item].needsUpdate = true
                    }
                }

    
                h++
            }

            

        }
        
    }

    findInterval(num, arr) {
        for (let i = 1; i < arr.length; i++) {
            if (num < arr[i]) {
                return i - 1;
            }
        }
        return arr.length - 1;
    }

}

