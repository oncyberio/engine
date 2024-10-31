import { Component3DData } from "engine/abstract/component3Ddata";
import { XYZ } from "../types";

/**
 * @public
 *
 * Data specification for {@link ImageComponent}, see {@link ComponentManager.create} on how to create a component
 */
export interface ImageComponentData extends Component3DData {

    /**
     * @internal
     */
    kit?: "cyber";

    type: "image";

    /**
     * if not provided, an auto id will be generated
     */
    id?: string;

    /**
     * name for the component. Defaults to ""
     */
    name?: string;

    /**
     * url of the image file
     */
    url: string;

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

    /**
     * @internal
     */
    borderColor?: string;

    /**
     * @internal
     */
    hd?: boolean;

    /**
     * Set opacity of the image. Defaults to 1
     */

    opacity?: number;

    
    /**
     * Set if the image should use mipmaps. Defaults to true
     */
    useMipMap?: boolean;


    /**
     * Set the minFilter of the image. Defaults to 'LinearMipmapLinearFilter'
     */
    minFilter?: string 

    /**
     * Set the magFilter of the image. Defaults to 'LinearFilter'
     */
    magFilter?: string
}
