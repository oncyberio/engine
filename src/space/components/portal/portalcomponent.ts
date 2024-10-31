// @ts-check

import {
    Vector3,
} from 'three'

import { Component3D } from "engine/abstract/component3D";
import { PortalFactory } from "engine/components/portal";
import { PortalComponentData } from './portalcomponentdata';

const temp = new Vector3()

/**
 * @internal
 */
export class PortalComponent extends Component3D<PortalComponentData> {

    private _factory: PortalFactory = null;
    private _portal = null;

    /**
     * @internal
     */
    constructor(opts) {
        super(opts);
        this._factory = opts.portalFactory;
    }

    /**
     * @internal
     */
    async init() {
        const { position, rotation, scale, ...opts } = this.data;

        this._portal = await this._factory.get(this.opts.space, this.data);

        this.update3D();

        this.add(this._portal);
    }

    getCollisionMesh() {

        return this._portal;
    }

    /**
     * @internal
     */
    update3D(){
        const { position, rotation, scale, ...opts } = this.data;
        this._portal.position.copy(position);
        this._portal.scale.copy(scale);
        this._portal.rotation.set(rotation.x, rotation.y, rotation.z);
    }

    get height() {

        return this._portal.userData.height;
    }

    get width() {

        return this._portal.userData.width;
    }
    /**
     * @internal
     */
    dispose() {
        this._portal.dispose()
    }
}
