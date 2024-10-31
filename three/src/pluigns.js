
import { World, ComponentTypes, seconds, Components, Player, Plugins } from "@oo/scripting"

import { GameControls } from "./Controls"

import gsap from 'gsap'

class  PickUpsEffects {

    effects = []

    normalSpeed = null

    tween = null

    
    rainbowPlugin = new Plugins.VISUALS.RainbowPlugin() 
   // dissolvePlugin = new Plugins.VISUALS.DissolvePlugin()

    constructor(){

    }

    setPlugins(){


        Player.setAvatarData({
            type: "avatar",
            id: `player-main`,
            plugins: [this.rainbowPlugin],
            name: "main",
            avatarScale: 1,
            url: "https://cyber.mypinata.cloud/ipfs/QmVtcNP9QYyoR78ZAH34YZL3gbQU9m9ipVzAnivigRa6Zb",
            // picture: opts.user.avatarUrl,
            useMixer: true,
            main: true,
            collider: {
                enabled: true,
                rigidbodyType: "PLAYER",
                type: "CAPSULE",
                groups: [3 /** GROUPS.PLAYERS */],
            },
        })

        // ADD PLUGINS


        Components._data.forEach( (element) => { 

            if(element.kitType == 'pickup'){

                element.plugins = [ Plugins.VISUALS.RotateAndDissolvePlugin.name ]

                element.shadow  = 'dynamic'
            }
            if( element.kitType == 'platform_02' || element.kitType == 'turn_machine_01' || element.kitType =='turn_machine_02' || element.kitType =='platform_03' ){

                element.shadow  = 'dynamic'
            }

            element.shadow  = 'dynamic'
        })

        this.rainbowPlugin.uniforms.rainbowAmount.value = 0

        this.rainbowPlugin.uniforms.rainbowSpeed.value = 16

        

    }


    setPickup(){

        if(this.tween){

            this.tween.kill()

            this.tween = null 

            GameControls.controls.run.maxSpeed = this.normalSpeed
        }

        if ( this.normalSpeed == null ){

            this.normalSpeed =  GameControls.controls.run.maxSpeed

        }

        this.rainbowPlugin.uniforms.rainbowAmount.value = 4

        GameControls.controls.run.maxSpeed = this.normalSpeed * 2

        this.tween = gsap.delayedCall( 5, ()=>{

            GameControls.controls.run.maxSpeed = this.normalSpeed

            this.rainbowPlugin.uniforms.rainbowAmount.value = 0
        })
    }

    on( player, collision, delta, playerCollider, coll ){

        var collider = coll 

        if( collider._scriptData == null ) {

            collider._scriptData = {}
        }
        if( collider._scriptData.collided != true ) {

            collider._scriptData.collided = true

            let val = {
                amount : 1
            }

            this.setPickup()

            gsap.to(val, {

                amount: 0,
                duration: 1,
                onUpdate:()=>{
                    collider._parent.userData.mesh.setPlugins('rotateAndDissolveAmount', val.amount)
                    
                },
                onComplete:()=>{

                    gsap.delayedCall(3, ()=>{

                            gsap.to(val, {

                            amount: 1,
                            duration: 1,
                            onUpdate:()=>{

                                collider._parent.userData.mesh.setPlugins('rotateAndDissolveAmount', val.amount)
                            },

                            onComplete:()=>{
                                
                                collider._scriptData.collided  = false
                            }
                        })
                        
                    })
                }
            })

        }

        collider.collided = true 
    }
}

export default new  PickUpsEffects()