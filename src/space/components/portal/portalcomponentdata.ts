import { Component3DData } from "engine/abstract/component3Ddata";
import { XYZ } from "../types";

/**
 * @public
 *
 * Data specification for {@link DialogComponent}, see {@link ComponentManager.create} on how to create a component
 */
export interface PortalComponentData extends Component3DData {
    /**
     * @internal
     */
    kit?: "cyber";

    type: "portal";

    /**
     * if not provided, an auto id will be generated
     */
    id?: string;

    /**
     * name for the component. Defaults to ""
     */
    name?: string;

    /**
     * Position of the component in the space. Defaults to {x: 0, y: 0, z: 0}
     */
    position?: XYZ;

    /**
     * Rotation of the component in the space. Defaults to {x: 0, y: 0, z: 0}
     * Do not set any rotation on the component if the dialog is billboarded
     */
    rotation?: XYZ;

    /**
     * Scale of the component in the space. Defaults to {x: 1, y: 1, z: 1}
     */
    scale?: XYZ;

    /**
     * The URL of the 360 image or image to be displayed in the portal
     */
    previewImage: {
        img360: string;

        img: string;
    };

    /**
     * The shape of the portal
     *
     * @default "square"
     */
    shape: "circle" | "square";

    /**
     * The destination of the portal
     */
    destination: {
        spaceId: string;
    };

    originalPosition?: XYZ;

    originalRotation?: XYZ;

    /**
     * @internal
     */
    parent: any;
}
