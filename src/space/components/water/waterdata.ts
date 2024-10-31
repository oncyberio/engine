import { Component3DData } from "engine/abstract/component3Ddata";
import { XYZ } from "../types";

/**
 * @public
 *
 * Data specification for {@link WaterComponent}, see {@link ComponentManager.create} on how to create a component
 */
export interface WaterComponentData extends Component3DData {
    /**
     * Position of the component in the space. Defaults to {x: 0, y: 0, z: 0}
     */
    position?: XYZ;

    /**
     * Rotation of the component in the space. Defaults to {x: 0, y: 0, z: 0}
     */
    rotation?: XYZ;

    /**
     * Scale of the component in the space. Defaults to {x: 1000, z: 1000}
     */
    scale?: { x: number; z: number };

    /**
     * Color of the water. Defaults to #001E0F
     */
    color?: string;

    /**
     * Opaque of the water. Defaults to 1
     */
    opacity: number;
}
