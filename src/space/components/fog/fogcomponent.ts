// @ts-check

import { Component3D, DataChangeOpts } from "engine/abstract/component3D";
import Fog from "engine/components/fog";

/**
 * @public
 *
 * This component is used to activate a fog in the game. Use the studio to configure the fog for the space.
 *
 * This is a singleton component. You can only have one fog in the game.
 */
export class FogComponent extends Component3D {
    //
    protected async init() {
        //
        this._update3D();
    }

    /**
     * @internal
     */
    onDataChange(opts: DataChangeOpts): void {
        //
        this._update3D();
    }

    private _update3D() {
        //
        this.space.fog = Fog.get(this.space.background?.getRaw(), this.data, 0);
    }

    protected dispose() {
        //
        this.space.fog = null;
    }

    get near(){

        return this.space.fog.near
    }
    
    set near( val : number ){

        this.space.fog.near = val
    }

    get far(){

        return this.space.fog.far
    }

    set far( val : number ){

        this.space.fog.far = val
    }
   
}
