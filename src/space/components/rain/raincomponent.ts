// @ts-check

import RainFactory from "engine/components/rain";
import { Component3D } from "engine/abstract/component3D";
import type RainMesh from "engine/components/rain/rain";
import { DisposePipelinesMeshes } from "engine/utils/dispose.js";
import { Folder, Param } from "engine/space/params";

/**
 * @public
 *
 * This component is used to display rain in the game. Use the studio to configure the rain for the space.
 *
 * This is a singleton component. You can only have one rain in the game.
 */
export class RainComponent extends Component3D<any> {
    //
    #rain: RainMesh = null;

    protected async init() {
        this.#rain = RainFactory.get(this.data);

        this.add(this.#rain);
    }

    /**
     * @internal
     */
    onDataChange() {
        this.#rain.intensity = this.data.intensity;
    }

    protected dispose() {
        DisposePipelinesMeshes(this.#rain);

        this.#rain.dispose();

        this.#rain = null;
    }

    /**
     * Public api
     */

    @Folder("Intensity")
    @Param({ min: 0, max: 1, step: 0.01 })
    /**
     * Intensity of the rain
     */
    intensity: number = 0.5;
}
