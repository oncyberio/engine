import { Component3D, DataChangeOpts } from "engine/abstract/component3D";
import ReflectorFactory from "engine/components/reflector";
import { Assets } from "engine/assets";
import { Param } from "engine/space/params";

/**
 * @public
 *
 * This component is used to display a reflective plan in the game. Use the studio to configure the reflector for the space.
 *
 * This is a singleton component. You can only have one reflector in the game. For performance reasons,
 * adding both a water and a reflector component to the same space is not supported.
 */
export class ReflectorComponent extends Component3D<any> {
    //
    private _reflector = null;

    protected async init() {
        //
        this._reflector = ReflectorFactory.getRaw(this.data);

        this.add(this._reflector);

        this._update3D();
    }

    /**
     * @internal
     */
    onDataChange(opts: DataChangeOpts): void {
        // console.log("ReflectorComponent onDataChange", opts);
        this._update3D();
    }

    /**
     * @internal
     */
    syncWithTransform(isProgress = false) {
        //
        this._assignXYZ("position", this.position);

        this._assignXYZ("rotation", this.rotation);
    }

    private _update3D(opts?: DataChangeOpts) {
        //
        this._updateTransform(opts, { position: true, rotation: true });

        this._reflector.scale.x = this.data.scale.x;

        this._reflector.scale.y = this.data.scale.z;

        this._reflector.opacity = this.data.opacity;

        this._reflector.color = this.data.color;

        this._reflector.blur = this.data.blur;

        this._reflector.useNormalMap = this.data.normalmap.enabled;

        this._reflector.normalStrength = this.data.normalmap.strength;

        this._reflector.tiles = this.data.normalmap.tiles;

        if (this.data.normalmap.enabled) {
            //
            const nmap = this.data.normalmap.images;

            const path = Assets.normalMaps[nmap.id] || nmap.path;

            this._reflector.normalMap = path;
        }
    }

    protected _onCreateCollisionMesh() {
        return this._reflector;
    }

    protected dispose() {
        this._reflector?.dispose();
    }

    /**
     * Public api
     */

    @Param() color = "#9fbada";

    @Param() opacity = 1;

    @Param() blur = true;
}
