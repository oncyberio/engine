import { Component3D,DataChangeOpts } from "engine/abstract/component3D";
import { IframeComponentData } from "./iframedata";
import {  MeshBasicMaterial, PlaneGeometry,Mesh, Color, NoBlending, Vector3, Vector2, DoubleSide } from "three";

export type { IframeComponentData } from "./iframedata";

import { CANVAS, CSS_CANVAS, CSS_FACTOR, IS_MOBILE } from "engine/constants";

import { CSS3DObject } from "engine/css3D/css3Drenderer"

import CSS3D from "engine/css3D/renderer"

const padding = 0

const direction = new Vector3()

const origin = new Vector3()

/**
 * @public
 *
 * Image component, used to display images in the game (.png, .jpg, .jpeg)
 *
 * See {@link IframeComponentData} for the data schema used to create an iframe component
 */
export class IframeComponent extends Component3D<IframeComponentData> {

    /**
     * @internal
     */
    constructor(opts) {
        //
        super(opts);

    }

    cssObject: CSS3DObject;

    glCache: Mesh;

    glPlane: Mesh;

    iframe: HTMLIFrameElement;

    player = null;

    camera = null;

    physics = null;

    canvas = null;


    protected init = async () => {

        this.canvas =  document.getElementById("game-canvas");


        // iframe

        this.generateIframe()

        this.generatePlanes()


        this._update3D( false )

        const scriptFactory = this.opts.space.resources.scriptFactory;

        // @ts-ignore
        const { Player, Camera, Physics } = scriptFactory.imports["@oo/scripting"];

        this.player = Player;

        this.camera = Camera;

        this.physics = Physics;

        if (!this.editor) {

            this.addEvents()
        }

    }

    private addEvents = () => {


        if (IS_MOBILE) {

            window.addEventListener("touchend", this.onTouchEnd);

            window.addEventListener("touchstart", this.onTouchStart);

            window.addEventListener("touchmove", this.onTouchMove);
        } else {

            window.addEventListener("mousemove", this.onMouseMove);
        }
    }

    private removeEvents = () => {

        if (IS_MOBILE) {

            window.removeEventListener("touchend", this.onTouchEnd);

            window.removeEventListener("touchstart", this.onTouchEnd);

            window.removeEventListener("touchmove", this.onTouchEnd);
        } else {

            window.removeEventListener("mousemove", this.onMouseMove);
        }
    }

    isDragging = false;

    private onTouchStart = (e) => {

        this.isDragging = false;

        // this.canvas.style.pointerEvents = "auto";

    }

    private onTouchMove = (e) => {

        this.isDragging = true;

    }

    private onTouchEnd = (e) => {

        if (this.isDragging) {

            this.isDragging = false;

            return;
        }

        e.clientX =  e.changedTouches[0].clientX;

        e.clientY =  e.changedTouches[0].clientY;

        this.handleActivation(e)
    }

    private onMouseMove = (e) => {

        this.handleActivation(e)

    }

    handleActivation = (e) => {

        if (!IS_MOBILE && document.pointerLockElement === this.canvas) return;

        const hit = this.raycast(e);

        // if (e.target !== this.canvas) return;

        if (hit?.componentType === "iframe") {

            this.canvas.style.pointerEvents = "none";

        } else {

            this.canvas.style.pointerEvents = "all";

        }
    }

    mousevec = new Vector2();

    raycast = (e) => {

        if (!this.player || !this.camera || !this.physics) return;

        const rect = this.canvas.getBoundingClientRect();

        const normalized = {
            x: ((e.clientX - rect.left) / rect.width) * 2 - 1,

            y: ((e.clientY - rect.top) / rect.height) * 2 - 1,
        };

        this.mousevec.set(

            normalized.x,

            -normalized.y

        );

        origin.setFromMatrixPosition( this.camera.matrixWorld );

        direction.set( this.mousevec.x, this.mousevec.y, 0.5 ).unproject( this.camera ).sub( origin ).normalize();

        const res = this.physics.raycast({

            origin,

            direction,

            maxDistance: 1000,

            ignoreRigidbody: this.player?.avatar?.rigidBody?.raw

        })

        if (res) {

            // @ts-ignore
            const mesh = res.hit?.mesh;

            return mesh;
        }

        return null;
    }

    private generateIframe(){

        if( this.cssObject ) {

            CSS3D.remove(this.cssObject)

            this.cssObject = null
        }

        if( this.iframe ) {

            this.iframe.remove()

            this.iframe = null
        }

        this.iframe = document.createElement( 'iframe' );
        this.iframe.style.backgroundColor = "#fff";

        // starts with http:// or https:// regex
        const isStartingWithHttp = /^(http|https):\/\//.test(this.data.url)

        this.iframe.src = isStartingWithHttp ? this.data.url : `https://${this.data.url}`

        this.iframe.style.pointerEvents = "all"
        this.cssObject = new CSS3DObject(this.iframe)
        CSS3D.add( this.cssObject )

        console.log("iframeiframeiframeiframeiframeiframeiframeiframe", this.cssObject)
    }

    private generatePlanes(){

        const geometry  =  new PlaneGeometry(1, 1)

        const material = new MeshBasicMaterial({

            color: new Color("black"),
            fog: false,
            blending: NoBlending,
            opacity: 0,
            side: DoubleSide
        })

        this.glPlane = new Mesh( geometry,  material );

        this.glCache = new Mesh( geometry, new MeshBasicMaterial({

            color: new Color("black"),
            fog: true,
            blending: NoBlending,
            // transparent : true

        }))

        this.glCache.visible = true

        this.cssObject.glCache = this.glCache
        this.cssObject.glPlane = this.glPlane

        this.add(this.glPlane)

        this.add(this.glCache)

    }

     /**
     * @internal
     */
    onDataChange(opts: DataChangeOpts): void {


        if( opts.prev.url !== this.data.url ){

            this.dispose()

            this.generateIframe()

            this.generatePlanes()
        }

        this._update3D(opts.isProgress)
    }

    /**
     * @internal
     */
    _update3D(isProgress: boolean) {

        this.iframe.style.width = `${ this.data.scale.x * CSS_FACTOR + padding}px`
        this.iframe.style.height = `${ this.data.scale.y * CSS_FACTOR + padding}px`

        this.position.set( this.data.position.x, this.data.position.y, this.data.position.z )
        this.rotation.set( this.data.rotation.x, this.data.rotation.y, this.data.rotation.z )
        this.scale.set( this.data.scale.x, this.data.scale.y, this.data.scale.z )


        this.cssObject.position.set( this.data.position.x, this.data.position.y, this.data.position.z )
        this.cssObject.rotation.set( this.data.rotation.x, this.data.rotation.y, this.data.rotation.z )
        this.cssObject.position.multiplyScalar(CSS_FACTOR)
    }

    protected _onCreateCollisionMesh() {
        return this.glPlane;
    }

     /**
     * @internal
     */
    getCollisionMesh() {
        return this.glPlane;
    }



    // protected _getBBoxImp(target: Box3) {
    //     //
    //     // return target.setFromObject(this.getCollisionMesh());
    // }

    protected dispose() {

        if( this.glPlane){

            this.glPlane.parent.remove(this.glPlane)
            this.glPlane.geometry.dispose()
            this.glPlane.material.dispose()

            this.glPlane = null
        }

        if( this.glCache){

            this.glCache.parent.remove(this.glCache)
            this.glCache.geometry.dispose()
            this.glCache.material.dispose()

            this.glCache = null
        }


        if( this.cssObject){

            CSS3D.remove(this.cssObject)

            this.cssObject = null
        }


        if( this.iframe ){

            this.iframe.remove()

            this.iframe = null
        }

        //
        // this._imageFactory.dispose(this._image);

        // this._image = null;

        if (!this.editor) {

            this.removeEvents()
        }
    }

}
