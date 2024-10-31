// @ts-check

import DestinationFactory from "engine/components/destination";

import { Component3D } from "engine/abstract/component3D";

/**
 * @internal
 */
export class DestinationComponent extends Component3D {
    #destination = null;

    async init() {
        this.#destination = await DestinationFactory.get(this.data);

        this.add(this.#destination);
    }

    get portals() {

        return this.#destination.portals;
    }

    get portalsMixer() {

        return this.#destination.portalsMixer;
    }

    getCollisionMesh() {
        const collisions = this.#destination.buildCollisionMesh();

        return collisions;
    }

    dispose() {
        super.dispose();

        this.#destination?.destroy();
    }
}
