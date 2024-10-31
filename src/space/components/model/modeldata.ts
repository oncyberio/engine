import { Component3DData } from "engine/abstract/component3Ddata";
import { XYZ } from "../types";
import { RenderMode } from "engine/@types/types";

/**
 * @public
 *
 * Data specification for {@link ModelComponent}, see {@link ComponentManager.create} on how to create a component
 */
export interface ModelComponentData extends Component3DData {
    /**
     * @internal
     */
    kit?: "cyber";

    type: "model";

    /**
     * if not provided, an auto id will be generated
     */
    id?: string;

    /**
     * name for the component. Defaults to ""
     */
    name?: string;

    /**
     * url of the gltf/glb file
     */
    url: string;

    /**
     * @internal
     */
    optimized?: {
        high: string;
        low: string;
        low_compressed: string;
    };

    /**
     * @internal
     */
    mime_type?: "model/gltf-binary";

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
     * An object containing the names of the animations to play at start.
     */
    animations?: Record<string, boolean>;

    /**
     * @internal
     */
    envmap?: string;

    /**
     * @internal
     */
    envmapIntensity?: number;

    /**
     * Model render mode. Defaults to "default"
     */
    renderMode?: RenderMode;

    /**
     * Enable the animation system for this model. Defaults to false, works only on model that embeds animations
     */
    enableAnimation?: boolean;

    /**
     * Set the opacity of the model. Defaults to 1
     */
    opacity?: number;

    /**
     * Enable real time shadows for this model. Defaults to false
     */
    enableRealTimeShadow?: boolean;

    /**
     * Use transparency on the model. Defaults to true
     */
    useTransparency?: boolean;
}
