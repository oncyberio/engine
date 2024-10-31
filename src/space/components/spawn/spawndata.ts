import { Component3DData } from "engine/abstract/component3Ddata";
import { XYZ } from "../types";

/**
 * @public
 *
 * Data specification for {@link SpawnComponent}, see {@link ComponentManager.create} on how to create a component
 */
export interface SpawnComponentData extends Component3DData {
    /**
     * @internal
     */
    kit?: "cyber";

    type: "spawn";

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
    useUserAvatar?: boolean;

    defaultAvatar?: { url: string};

    useMixer?: boolean;

    renderMode?: "default" | "toon" | "glitch" | "ghost" | "error";

    plugins: any[];

    /**
     * scale of the avatar's vrm. Defaults to 1.
     */
    // avatarScale?: number;
}
