import { Component3DData } from "engine/abstract/component3Ddata";
import { XYZ } from "../types";

/**
 * @public
 *
 * Data for the {@link AudioComponent}, see {@link ComponentManager.create} on how to create a component
 */
export interface AudioComponentData extends Component3DData {
    /**
     * Type of the component
     */
    type: "audio";

    /**
     * if not provided, an auto id will be generated
     */
    id?: string;

    /**
     * name for the component. Defaults to ""
     */
    name?: string;

    /**
     * url of the audio file
     */
    url: string;

    /**
     * @internal
     */
    mime_type?: string;

    /**
     * Position of the audio in the space. Defaults to {x: 0, y: 0, z: 0}
     */
    position?: XYZ;

    /**
     * Rotation of the audio in the space. Defaults to {x: 0, y: 0, z: 0}
     */
    rotation?: XYZ;

    /**
     * Scale of the audio in the space. Defaults to {x: 1, y: 1, z: 1}
     */
    scale?: XYZ;

    /**
     * Volume of the audio, from 0 to 1. Defaults to 1
     */
    volume?: number;

    /**
     * weather the audio is used to play a background music. Defaults to false
     */
    ambient?: boolean;

    /**
     * Whether the audio should start playing automatically. Defaults to false
     */
    autoPlay: false;

    /**
     * Whether the audio should loop. Defaults to false
     */
    loop: false;

    /**
     * audio playback rate. Defaults to 1
     */
    playbackRate?: number;
}
