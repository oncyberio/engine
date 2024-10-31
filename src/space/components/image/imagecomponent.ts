import { Component3D } from "engine/abstract/component3D";
import { ImageFactory } from "engine/components/media/image";
import { ImageComponentData } from "./imagedata";
import { Box3, Mesh, MeshBasicMaterial } from "three";
import { Folder, Param } from "engine/space/params/decorators";
import InstancedMeshWrapper from "engine/abstract/instancemeshwrapper";

import {
    IS_EDIT_MODE,
    SET_SHADOW_NEEDS_UPDATE
} from 'engine/constants';

export type { ImageComponentData } from "./imagedata";

/**
 * @public
 *
 * Image component, used to display images in the game (.png, .jpg, .jpeg)
 *
 * See {@link ImageComponentData} for the data schema used to create an image component
 */
export class ImageComponent extends Component3D<ImageComponentData> {
    //
    private _imageFactory: ImageFactory = null;

    private _image: InstancedMeshWrapper = null;

    /**
     * @internal
     */
    constructor(opts) {
        //
        super(opts);

        this._imageFactory = opts.imageFactory;
    }

    protected async init() {
        //
        this._image = await this._imageFactory.get(this.opts.space, {
            ...this.data,
        });

        this._image.attachTo(this);
    }

       /**
     * @internal
     */
       async onDataChange(opts) {
        // need to respawn the model
        if (
            opts.prev?.useMipMap != this.data.useMipMap ||
            opts.prev?.minFilter != this.data.minFilter || 
            opts.prev?.magFilter != this.data.magFilter
        ) {

            this._imageFactory.dispose(this._image);

            this._image = await this._imageFactory.get(this.opts.space, {
                ...this.data,
            });

            this._image.attachTo(this)
        }

        if (
            IS_EDIT_MODE &&
            opts?.isProgress != true
        ) {
            SET_SHADOW_NEEDS_UPDATE(true);
            // console.log('the fuck')
        }

    }

    protected _changeCallbacks = {
        //
        opacity: (value) => {
            this._image.opacity = value;
        },
    };

    protected _onCreateCollisionMesh() {
        //
        return this._image.buildCollisionMesh();
    }

    protected _getBBoxImp(target: Box3) {
        //
        return target.setFromObject(this.getCollisionMesh());
    }

    protected dispose() {
        //
        this._imageFactory.dispose(this._image);

        this._image = null;
    }

    /*****************************************************************
     *                      Public API
     *****************************************************************/

    @Folder("Opacity")
    /**
     * Opacity of the image
     */
    @Param({ min: 0, max: 1, step: 0.01 })
    opacity: number = 1;

    @Folder("Texture")

    @Param({skipLabel: true})
    useMipMap: boolean = true;

    @Param({type:'select', options: ['NearestFilter', 'NearestMipmapNearestFilter', 'NearestMipmapLinearFilter', 'LinearFilter', 'LinearMipmapNearestFilter', 'LinearMipmapLinearFilter']})
    minFilter: string = 'LinearMipmapLinearFilter' 

    @Param({type:'select', options: ['NearestFilter', 'LinearFilter']})
    magFilter: string = 'LinearFilter' 
  
}
