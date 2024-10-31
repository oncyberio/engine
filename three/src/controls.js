
import { Camera, Player, Controls as ControlFactory, Emitter, Events, Device } from "@oo/scripting";
import * as THREE from "three"
import { config } from "./config"


class ControlsManager {

    controls: any;

    startPosition = new THREE.Vector3()

    startQuaternion = new THREE.Quaternion()

    private _active: boolean = false;

    private _firstStart = true;

    constructor() {

        this.addEvents()
    }

    onReady = () => {

        this.startPosition.copy(Camera.position)

        this.startQuaternion.copy(Camera.quaternion)

        this.initControls()

        this.active = false
    }
    

    get active() {

        return this._active
    }

    set active(val) {

        this._active = val

        if(this.controls) {

            this.controls.active = this._active
        }
    }
    
    onStart = () => {

        if(this._firstStart) {

            this.startPosition.copy(Player.avatar.position)

            this._firstStart = false
        }
        else {

            this.initPlayerPosition()
        }

        this.active = true

    }


    onUpdate = (dt: number) => {

        // this.updateAnimation()
    }

    onPause = () => {

        this.active = false
    }

    onResume = () => {

        this.active = true
    }

    onEnd = () => {

        this.active = false

        if (!Device.isMobile) {

            document.exitPointerLock()
        }
    }

    onDispose = () => {

        this.removeEvents()
    }

    private addEvents() {

        Emitter.on(Events.GAME_READY, this.onReady)

        Emitter.on(Events.GAME_START, this.onStart)

        Emitter.on(Events.GAME_UPDATE, this.onUpdate)

        Emitter.on(Events.GAME_END, this.onEnd)

        Emitter.on(Events.GAME_DISPOSE, this.onDispose)
    }

    private removeEvents() {

        Emitter.off(Events.GAME_READY, this.onReady)

        Emitter.off(Events.GAME_START, this.onStart)

        Emitter.off(Events.GAME_UPDATE, this.onUpdate)

        Emitter.off(Events.GAME_END, this.onEnd)

        Emitter.off(Events.GAME_PAUSE, this.onPause)

        Emitter.off(Events.GAME_RESUME, this.onResume)

        Emitter.off(Events.GAME_DISPOSE, this.onDispose)
    }

    private initControls() {

        const conf = config.controls

        if(conf?.type === "platformer") {

            this.controls = ControlFactory.get({
                type: "platformer",
                object: Player.avatar,
                target: Camera,
                params: {
                    run : {
                        maxSpeed : conf.params.walkSpeed,
                        boost: conf.params.runSpeed / conf.params.walkSpeed
                    },
                    jump: {  
                        height: conf.params.jumpHeight,
                        duration: conf.params.jumpDuration
                    },
                    autoAnimate: conf.params.autoAnimate
                }
            })

            window["$controls"] = this

            if(conf.camera?.mode === "thirdperson") {

                Camera.mode =  'thirdperson'
                
                Camera.target = Player.avatar

                Camera.maxZoomOut = conf.camera.maxZoomOut
            }
            else if(conf.camera?.mode === "firstperson") {

                Camera.mode = "firstperson"
            }
        }
    }

    private initPlayerPosition() {
        
        Player.avatar.collider.rigidBody.setTranslation({
            x: this.startPosition.x, 
            y: this.startPosition.y + 5, 
            z: this.startPosition.z 
        })

        Player.avatar.collider.rigidBody.setRotation(
            this.startQuaternion
        )

    }

}



export const GameControls = new ControlsManager()