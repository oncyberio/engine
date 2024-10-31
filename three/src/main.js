
import { World, ComponentTypes, seconds, Components, Player, Plugins} from "@oo/scripting"

import { Multiplayer } from './Multiplayer'

import Generation from './generation'

import PickUpsEffectsAndPlugins from './pickupandplugins'

import { GameControls } from "./Controls"

import { Display } from "./Display"

import { config } from "./config"

import { Vector3, Matrix4, Vector4 } from 'three'

import {  World as RapierWorld  } from "@dimforge/rapier3d";

import CheckPoint from './checkpoint'

const rapierworld = World.physics.world as RapierWorld;

import RandomGenerator from './random'

const params = new URLSearchParams(window.location.href)




function rotateAroundCenter(cx, cz, x, z, angleRadians) {
    // Convert the angle to radians
    

    // Translate point to the origin (center)
    var tempX = x - cx;
    var tempZ = z - cz;

    // Rotate the point
    var rotatedX = tempX * Math.cos(angleRadians) - tempZ * Math.sin(angleRadians);
    var rotatedZ = tempX * Math.sin(angleRadians) + tempZ * Math.cos(angleRadians);

    // Translate point back
    var finalX = rotatedX + cx;
    var finalZ = rotatedZ + cz;

    return { x: finalX, z: finalZ };
}

const temp = new Vector3()
const temp2 = new Vector3()

export default class GameManager {

    starTimer = 0

    turnMachines = []

    pickups = []

    upPlatforms = []

    platform_rotators = []

    async onPreload() { 

        Multiplayer.connect()

        await Multiplayer.ready

        Multiplayer.room.onStop(() => {

            World.stop()
        })

        var seed = Multiplayer.room.state.seed

        if( params.get('seed') != null ) {

            seed = parseInt(params.get('seed'))
        }

        console.log('SEED : ', seed )

        RandomGenerator.seed( seed )

        PickUpsEffectsAndPlugins.setPlugins()
    }

    async onReady() {

        GameControls.controls.characterController.gravity.y = -1.0
        
        const res = await Generation.generate()

        const center = res.dimensions.getCenter( temp )

        const size = res.dimensions.getSize( temp2 ) 

        size.x += 100

        size.z += 100


         var wind = Components
            .create({
                type: "dust",
                target: Player.avatar,
                condition: ()=>{

                    return GameControls.controls.characterController.onFloor
                }
                
            })


        let m = 0

        while(m < 250 ) {

            let ss = Math.random() * 10 + 4
            
            let cloud = await Components.create({

                type: "cloud",

                position : {
                    
                    x: center.x + (RandomGenerator.float() * size.x) - size.x * 0.5, 
                    y: center.y + 40 + RandomGenerator.float() * 20,
                    z: center.z + (RandomGenerator.float() * size.z) - size.z * 0.5
                },

                opacity: Math.random() * 0.2  + 0.8,

                scale : {

                    x: ss,
                    y: ss,
                    z: ss
                },

                atlas: Math.floor(  RandomGenerator.float() * 4  ) 


            })

            m++
        }

      


        let jumper = Components.filter( (it)=>{

            return it.data.kitType == 'jumper'
        })

    

        let g = 0

        while(g < jumper.length){

            var b = jumper[g]

            b.collider.rigidBody.setTranslation( b.position )

            b.onCollisionCallback = 

            ( player, collision ){

                const factor= 0.75


                

                player.setForce( {x: player.velocity.x * factor, y: collision.normal1.y * factor, z: player.velocity.z * factor}, {

                    negateOnFloor: { y : true, xz: false }, dampling: 0.05
                });
                
            }

            g++
        }

         let bouncers = Components.filter( (it)=>{

            return it.data.kitType == 'bouncer'
        })
    

        g = 0

        while(g < bouncers.length){

            var b = bouncers[g]

            b.collider.rigidBody.setTranslation( b.position )

            b.onCollisionCallback = 

            ( player, collision ){

                const factor= 0.25

                player.setForce( {x: collision.normal1.x * factor, y: collision.normal1.y * factor, z: collision.normal1.z * factor}, {

                    negateOnFloor: { y : true, xz: false }, dampling: 0.05, unique: 'bouncer_round'
                });
                
            }

            g++
        }



        this.turnMachines = Components.filter( (it)=>{

            return it.data.kitType == 'turn_machine_01' || it.data.kitType == 'turn_machine_02' 
        })


        let i = 0

        while(i < this.turnMachines.length ) {

            const turn = this.turnMachines[i]

            turn.rotation.y += RandomGenerator.float() * 3.1416

            turn.collider.rigidBody.setRotation(  turn.quaternion )

            turn.direction = -1
            
           /* turn.onCollisionCallback = 

                ( player, collision ){

                    if( collision.normal1.y < 0.5 ) {

                       // console.log( Player.avatar.collider.rigidBody )

                        //Player.avatar.collider.rigidBody.setEnabledRotations(true, true, true ,true)

                        //player.setRotationForce(collision.normal1, {} )

                        const factor= 0.1

                        player.setForce( {x: collision.normal1.x * factor, y: collision.normal1.y * factor, z: collision.normal1.z * factor}, {

                            negateOnFloor: { y : true, xz: false }, dampling: 0.05
                        })
                    }
                }*/

            i++
        }

        const rotatePlatforms = Components.filter( (it)=>{

            return it.data.kitType == 'platform_04'
        })

        i = 0

        while(i < rotatePlatforms.length ) {

            this.turnMachines.push(rotatePlatforms[i])

            const turn = rotatePlatforms[i]

            /*
            turn.direction = 1

            turn.rotation.y += RandomGenerator.float() * 3.1416

            turn.collider.rigidBody.setRotation(  turn.quaternion )
            */

            turn.onCollisionCallback = 

                ( player, collision, delta )=>{

                    if( collision.normal1.y > 0.5 ) {

                        const center = collision.collider.translation()

                        const collisionPosition = collision.witness1

                        const newpos = rotateAroundCenter(center.x, center.z, collisionPosition.x, collisionPosition.z, -delta);

                        const diff = { x : newpos.x - collisionPosition.x , z: newpos.z - collisionPosition.z }

                         player.setForce( {x: diff.x, y: 0, z: diff.z}, {

                            dampling: 1,
                            once: true
                        })
                    }
                }

            i++
        }


        this.upPlatforms = Components.filter( (it)=>{

            return it.data.kitType == 'platform_03'
        })

        i = 0

        while( i < this.upPlatforms.length ){

            this.upPlatforms[i].originalPosition = {
                
                x:  this.upPlatforms[i].position.x,
                y:  this.upPlatforms[i].position.y,
                z:  this.upPlatforms[i].position.z
            }

            this.upPlatforms[i].randomOffset = RandomGenerator.float() * 10

            i++
        }


        const speedplatforms  = Components.filter( (it)=>{

            return it.data.kitType == 'speed_plateform'
        })

        i = 0

        while(i < speedplatforms.length ) {

            const platform =  speedplatforms[i]

            platform.onCollisionCallback = ( player, collision, delta )=>{

                platform.getWorldDirection( temp )

                const factor = 0.13
        
                temp.multiplyScalar( factor )
        
                player.setForce({x: temp.x, y: temp.y, z: temp.z}, {
                    dampling: 0.1,
                    unique: 'speed_platform',
                    once: false
                })
            }

            i++
        }

        const bariers = Components.filter( (it)=>{

            return it.data.kitType == 'bariere' || it.data.kitType == 'divider01'
        })


        i = 0

        while(i < bariers.length ) {

            const barier =  bariers[i]

            barier.onCollisionCallback = ( player, collision, delta )=>{
            
                player.setRebound( {x: collision.normal1.x, y: collision.normal1.y, z: collision.normal1.z , {
                    
                    force: 0.5
                })
            }

            i++
        }


        this.platform_rotators = Components.filter( (it)=>{

            return it.data.kitType == 'platform_02' 
        })


        // BALANCERS => 

        const balancerPhysics = new Plugins.PHYSICS.BalancerPhysics( rapierworld, {x: 1, y: 0, z: 0} )

        i = 0

        while(i < this.platform_rotators.length ) {

            balancerPhysics.add( this.platform_rotators[i] )
            
            i++
        }


        // <= BALANCERS 

        this.pickups = Components.filter( (it)=>{

            return it.data.kitType == 'pickup' 
        })

        i = 0

        while(i < this.pickups.length ) {

            var p = this.pickups[i]

            p.onCollisionCallback = ( player, collision, delta, playerCollider, coll ) => {

                PickUpsEffectsAndPlugins.on( player, collision, delta, playerCollider, coll )
               
            }
            
            i++
        }

        const ice_platforms  = Components.filter( (it)=>{

            return it.data.kitType == 'ice'
        })

        i = 0

        const v3 = new Vector3()

        while(i < ice_platforms.length ) {

            const ice =  ice_platforms[i]

            ice.onCollisionCallback = ( player, collision, delta )=>{

                const factor = 0.05

                if(player.controlVelocity.x != 0 || player.controlVelocity.z != 0 ) {

                    v3.copy(player.controlVelocity).normalize()

                    player.setForce( {x: v3.x * factor, y:  0.0, z: v3.z * factor}, {

                        dampling: 0.5,
                        unique: 'ice'
                    })
                }

               
            }

            i++
        }

        //World.physics.addEvents()

    }

    async syncObjects(){
        
        let i = 0

        while(i < this.turnMachines.length ) {

            const turn = this.turnMachines[i]

            turn.rotation.y = RandomGenerator.float() * 3.1416

            turn.collider.rigidBody.setRotation(  turn.quaternion )

            turn.direction = -1

            i++
        }

    }

    async onStart() {

        CheckPoint.start()
        
        config.elapsedTime = 0;

        this.syncObjects()
    }

    onUpdate(dt: number) {

       // console.log(  )

        config.elapsedTime += dt;

        let i = 0

        while(i < this.turnMachines.length ) {

            this.turnMachines[i].rotation.y += dt *  this.turnMachines[i].direction

            this.turnMachines[i].collider.rigidBody.setNextKinematicRotation(  this.turnMachines[i].quaternion )

            i++
        }     

        i = 0

        while(i < this.upPlatforms.length ) {

            this.upPlatforms[i].position.y = this.upPlatforms[i].originalPosition.y + Math.sin(config.elapsedTime + this.upPlatforms[i].randomOffset ) * 2.0

            this.upPlatforms[i].collider.rigidBody.setNextKinematicTranslation(  this.upPlatforms[i].position  )

            i++
        }  

        CheckPoint.update()

        i = 0

        Multiplayer.update(dt)
  
        //if(this.elapsedTime >= config.maxGameTime) {

         //   World.stop(1)
       // }
    }

    
    onDispose() {

        
    }
}

