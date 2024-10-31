import { World, ComponentTypes, seconds, Components, Player, Plugins } from "@oo/scripting"

import {

    Box3,

    Vector3

} from 'three'

const debug = true

import RandomGenerator from './random'

const temp3 = new Vector3()

const temp4 = new Vector3()

class Generation {

    currentPos = new Vector3(0, 0, 0)

    offset     = new Vector3(0, 0, 0)

    modulesNB = 24

    modulesIDs = 11

    modules = []

    globalBox = new Box3()

    constructor(){

    }

    store( name, opts = {}){

        this.modules[name] = Components.byTag( name ).slice(0)

        let i = 0

        while( i < this.modules[name].length ) {

            const component = this.modules[name][i]

            component.visible = false
            
            if( opts.visible != null ) {

                component.visible = opts.visible
            }

            i++
        }

    }

    setStart( name, opts = {} ){

        const modules = this.modules[name]

        const box = new Box3()

        modules.forEach(( component )=>{

            if( component.collisionMesh ) {

                component.collisionMesh.geometry.computeBoundingBox()

                const b = component.collisionMesh.geometry.boundingBox.clone()

                b.applyMatrix4(component.matrixWorld)

                box.union(b)
            }

        
        })

        box.getSize( temp3 )
        box.getCenter( temp4 )

        this.currentPos.add(  new Vector3( temp4.x,  0.0,  temp4.z + temp3.z * 0.5 ) )
    }



    async generate(){

        this.store( 'module_00', { visible : true} )
        this.store( 'module_01' )
        this.store( 'module_02' )
        this.store( 'module_03' )
        this.store( 'module_04' )
        this.store( 'module_05' )
        this.store( 'module_06' )
        this.store( 'module_07' )
        this.store( 'module_08' )
        this.store( 'module_09' )
        this.store( 'module_10' )
        this.store( 'module_11' )
        this.store( 'module_12' )
        this.store( 'module_checkpoint' )
        this.store( 'module_final' )
        this.store('module_lobby' )

        this.setStart('module_00')

        let i = 0



         //await this.placement( 'module_06')

        /*
        await this.placement( 'module_01')
        await this.placement( 'module_02')
        await this.placement( 'module_03')
        await this.placement( 'module_04')
        await this.placement( 'module_05')
        await this.placement( 'module_06')
        await this.placement( 'module_07')
        await this.placement( 'module_08')
        await this.placement( 'module_09')
        await this.placement( 'module_10')
        */



       let previousstr = null
        
       while(i < this.modulesNB ) {

            // lets not it be the starting 
            let rdm = Math.floor( RandomGenerator.float() * this.modulesIDs ) + 1 

            let str = 'module_' + ( rdm < 10 ? '0' : '' ) + rdm

            console.log( str )

            while( previousstr == str  || str == 'module_02' ) {

                rdm = Math.floor( RandomGenerator.float() * this.modulesIDs ) + 1 

                str = 'module_' + ( rdm < 10 ? '0' : '' ) + rdm
            }

            await this.placement( str )

            previousstr = str

            i++

            if( i%3==0){

                await this.placement( 'module_checkpoint')
            }

         
        }

        await this.placement( 'module_final' )
    
        

        return {

            dimensions : this.globalBox
        }
        
    /*
        await this.placement( 'module_05' )
        await this.placement( 'module_01' )
        await this.placement( 'module_02' )
        await this.placement( 'module_03' )
        await this.placement( 'module_04' )

    */
       
        
    }

    async placement( name ){

        if( debug ) {

            console.log('seed placement ', name )
        }

        const modules = this.modules[name]

        const box = new Box3()

        modules.forEach(( component )=>{

            if( component.collisionMesh ) {

                component.collisionMesh.geometry.computeBoundingBox()

                const b = component.collisionMesh.geometry.boundingBox.clone()

                b.applyMatrix4(component.matrixWorld)

                box.union(b)
            }

        })
    
          // center box real size
        box.getCenter(temp3 )

        box.getSize( temp4 )
        // move back to center

        let i = 0

        this.currentPos.z += this.offset.z


        while(i < modules.length ) {

            const component = modules[i]

            let c = await component.duplicate()

            c.position.x -= temp3.x
            c.position.z -= temp3.z

            //c.position.x += ( box.min.x + box.min.x ) * 0.5
            c.position.z += temp4.z * 0.5
            //c.position.x += temp4.x * 0.5

            c.position.x += this.currentPos.x
            c.position.z += this.currentPos.z

            c.collider.rigidBody.setTranslation( c.position )
            c.collider.rigidBody.setRotation( c.quaternion )

            c.updateMatrixWorld()

            const e = c.collisionMesh.geometry.boundingBox.clone()

            e.applyMatrix4(c.matrixWorld)

            this.globalBox.union(e)

            i++
        }

        this.currentPos.z += temp4.z
    }


    getByTag( name ){

        let res = []

        Components._data.forEach( (element) => { 

            if( element?.script?.tag == name ) {
 
                res.push( element )
            }
        })

        return res
    }

}

export default new Generation()