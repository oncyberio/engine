// @ts-check

import { Component3D } from "engine/abstract/component3D";
import { ModelFactory } from "engine/components/media/model";
import { ModelComponentData } from "./modeldata";
import { IS_EDIT_MODE, SET_SHADOW_NEEDS_UPDATE } from "engine/constants";
import { Param } from "engine/space/params";
import { RenderMode } from "engine/@types/types";
import { Box3 } from "three";
export type { ModelComponentData } from "./modeldata";

/**
 * @public
 *
 * Model component, used to display gltf 3D models in the game (.gltf, .glb)
 *
 * See {@link ModelComponentData} for the data schema used to create a model component
 */
export class ModelComponent extends Component3D<ModelComponentData> {
    //
    private _modelFactory: ModelFactory = null;

    private _model = null;

    private _renderMode = "default";

    /**
     * @internal
     */
    constructor(opts) {
        //

        super(opts);

        this._modelFactory = opts.modelFactory;
    }

    protected async init() {
        //
        const data = structuredClone(this.data) as any;

        data.type = "cyber/model";

        data.url = this.data.optimized?.high || this.data.url;

        this._model = await this._modelFactory.get(this.opts.space, data);

        // never been set

        if (this.data.useTransparency == null) {
            // checking original detection if the useTransparency is null at first

            // disable the notification 3rd parameter
            this._dataWrapper.set(
                "useTransparency",
                this._model.useTransparency,
                false
            );
        }

        // console.log('useTransparency', this.data.useTransparency)

        this._renderMode = this.data.renderMode || "default";

        if (this._model.isClassic) {
            //
            this._model.position.set(0, 0, 0);

            this._model.quaternion.set(0, 0, 0, 1);

            this._model.scale.set(1, 1, 1);

            this.add(this._model);
            //
        } else {
            //
            this._model.attachTo(this);
        }

        this._update3D();
    }

    /**
     * @internal
     */
    updateFromSource() {
        if (this._model.isClassic != true) {
            this._model.updateFromSource();
        }
    }

    get mixer() {
        return this._model.mixer;
    }

    /**
     * @internal
     */
    getInstanceWrapper() {
        if (this._model.isClassic != true) {
            return this._model;
        } else {
            return null;
        }
    }

    private _collision = null;

    /**
     * @internal
     */
    getCollisionMesh() {
        //
        if (this._collision == null) {
            //
            this._collision = this._model.buildCollisionMesh();

            this._collision.visible = false;

            this.add(this._collision);
        }

        return this._collision;
    }

    protected _getBBoxImp(target: Box3) {
        //
        const mesh = this.getCollisionMesh();
        target.setFromObject(mesh);
        return target;
    }

    private _update3D() {
        //
        if (this._model.isClassic) {
            let animations = { ...this.data.animations };

            if (this.data.enableAnimation != true) {
                animations = {};
            }

            console.log("animations", animations);

            let i = 0;

            while (i < this._model.animations.length) {
                const name = this._model.animations[i].name;

                if (animations[name]) {
                    this._model.play(name);
                } else {
                    this._model.stop(name);
                }

                i++;
            }
        }

        this._model.opacity =
            this.data.useTransparency == true ? this.data.opacity : 1;
    }

    /**
     * @internal
     */
    async onDataChange(opts) {
        // need to respawn the model
        if (
            opts.prev?.renderMode != this.data.renderMode ||
            opts.prev?.enableRealTimeShadow != this.data.enableRealTimeShadow ||
            opts.prev?.useTransparency != this.data.useTransparency
        ) {
            this.stop();

            this.dispose();

            await this.init();

            SET_SHADOW_NEEDS_UPDATE(true);
        } else {
            if (
                opts.prev?.opacity != this.data.opacity ||
                opts.prev?.animations != this.data.animations
            ) {
                this._update3D();
            }
            //
        }

        if (
            IS_EDIT_MODE &&
            opts?.isProgress != true &&
            this.data.enableRealTimeShadow != true
        ) {
            SET_SHADOW_NEEDS_UPDATE(true);
            // console.log('the fuck')
        }
    }

    /**
     * @internal
     */
    async updateRenderMode(mode) {
        //
        if (mode != this.data.renderMode) {
            // with public api, maybe we can just set model.renderMode
            // make sure this is set, since I can call it from outside

            this.data.renderMode = mode;

            this.stop();

            this.dispose();

            await this.init();
        }
    }

    protected dispose() {
        //
        this._modelFactory.removeInstance(this._model);

        if (this.data.enableRealTimeShadow == false) {
            SET_SHADOW_NEEDS_UPDATE(true);
        }
    }

    /*****************************************************************
     *                      Public API
     *****************************************************************/

    /**
     * Play an animation on the 3D model. This applies only to animated gltf models containing animations.
     */
    play(name: string, opts) {
        if (!this._model.isClassic) return;

        this._model.play?.(name, opts);
    }

    /**
     * Stop an animation on the 3D model
     */
    stop(
        name: string,
        opts: {
            fadeOut?: number;
        }
    ) {
        if (!this._model.isClassic) return;

        this._model.stop?.(name, opts);
    }

    /**
     * Stop all animations on the 3D model
     */
    stopAll() {
        if (!this._model.isClassic) return;

        this._model.stopAll?.();
    }

    get activeAnimations() {
        return this._model.activeAnimations || {};
    }

    /**
     * Set the time of an animation on the 3D model
     */
    setAnimationAtTime(animation, val) {
        if (!this._model.isClassic) return;

        return this._model.setAnimationAtTime?.(animation, val);
    }

    /**
     * Get the animation data of the 3D model
     *
     */

    getAnimationData() {
        if (!this._model.isClassic) return;

        return this._model.getAnimationData?.(name);
    }

    /**
     * Model render mode. Defaults to "default"
     */
    @Param() renderMode: RenderMode = "default";

    /**
     * Enable the animation system for this model. Defaults to false, works only on model that embeds animations
     */
    @Param() enableAnimation = false;

    /**
     * Set the opacity of the model. Defaults to 1
     */
    @Param() opacity = 1;
}
