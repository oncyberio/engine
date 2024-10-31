import { Component3DData } from "engine/abstract/component3Ddata";
import { XYZ } from "../types";

/**
 * @public
 *
 * Data specification for {@link VideoComponent}, see {@link ComponentManager.create} on how to create a component
 */
export interface VideoComponentData extends Component3DData {
    /**
     * @internal
     */
    kit?: "cyber";

    type: "video";

    /**
     * if not provided, an auto id will be generated
     */
    id?: string;

    /**
     * name for the component. Defaults to ""
     */
    name?: string;

    /**
     * url of the video file
     */
    url: string;

    /**
     * url of the preview image to show when the video is not playing
     */
    preview?: string;

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
     * Volume of the audio, from 0 to 1. Defaults to 1
     */
    volume?: number;

    /**
     * @internal
     */
    audioType: "ambient"; // ambient, positional

    /**
     * Whether the video should start playing automatically. Defaults to false
     */
    autoPlay: false;

    /**
     * Set the opacity of the video. Defaults to 1
     */
    opacity: number;

    /**
     * Determine the display mode of the video. Defaults to "flat"
     */

    displayMode: "flat" | "curved";

    /**
     * The angle of the curved video. Defaults to 180
     */
    curvedAngle: number;

    /**
     * @Internal
     */
    muted?: boolean;
}
