import { Component3DData } from "engine/abstract/component3Ddata";
import { XYZ } from "../types";


/**
 * @public
 *
 * Data specification for {@link KitBashComponent}, see {@link ComponentManager.create} on how to create a component
 */
export interface KitbashComponentData extends Component3DData {

    /**
     * @internal
     */
    kit?: "cyber";

    type: "kitbash";

    /**
     * if not provided, an auto id will be generated
     */
    id?: string;

    /**
     * name for the component. Defaults to ""
     */
    name?: string;

    /**
     * Type of the kit asset
     */
    kitType: string;

    /**
     * Position of the component in the space. Defaults to {x: 0, y: 0, z: 0}
     */
    position?: XYZ;

    /**
     * Rotation of the component in the space. Defaults to {x: 0, y: 0, z: 0}
     */
    rotation?: XYZ;

    /**
     * Scale of the component in the space. Defaults to {x: 1, y: 1, z: 1}
     */
    scale?: XYZ;
}
