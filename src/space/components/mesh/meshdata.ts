import { Component3DData } from "engine/abstract/component3Ddata";
import { XYZ } from "../types";

/**
 * @public
 *
 * Data specification for {@link MeshComponent}, see {@link ComponentManager.create} on how to create a component
 */
export interface MeshComponentData extends Component3DData {
    /**
     * @internal
     */
    kit?: "cyber";

    type: "mesh";

    /**
     * if not provided, an auto id will be generated
     */
    id?: string;

    /**
     * name for the component. Defaults to ""
     */
    name?: string;

    /**
     * Geometry of the mesh. Defaults to a Box with a size of 1
     */
    geometry?: MeshGeometryData;

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
     * Color of the mesh. Defaults to "#ff0000"
     */
    color?: string;

    /**
     * Opacity of the mesh. Defaults to 1
     */
    opacity?: number;

    /**
     * Whether the mesh should be displayed in live mode. Defaults to true
     */
    display?: boolean;


    /**
     * Whether the mesh should be displayed in editor mode. Defaults to true
     */
    displayInEditor?: boolean;

    /**
     * Render mode of the mesh. Defaults to "dome"
     */
    renderMode: "wireframe" | "dome" | 'default' ;
}

/**
 * @public
 *
 * Geometry data for the {@link MeshComponentData.geometry} property
 */
export interface MeshGeometryData {
    type: "box" | "sphere" | "cylinder" | "dome";

    /**
     * Params for the Box geometry
     */
    boxParams: BoxParamsData;

    /**
     * Params for the Sphere geometry
     */
    sphereParams: SphereParamsData;

    /**
     * Params for the Cylinder geometry
     */
    cylinderParams: CylinderParamsData;
}

/**
 * @public
 *
 * Params for the {@link MeshComponentData.geometry.boxParams} property
 *
 * See {@link https://threejs.org/docs/#api/en/geometries/BoxGeometry | BoxGeometry}
 */
export interface BoxParamsData {
    width: number;
    height: number;
    depth: number;
}

/**
 * @public
 *
 * Params for the {@link MeshComponentData.geometry.sphereParams} property
 *
 * See {@link https://threejs.org/docs/#api/en/geometries/SphereGeometry | SphereGeometry}
 */
export interface SphereParamsData {
    radius: number;
    widthSegments: number;
    heightSegments: number;
}

/**
 * @public
 *
 * Params for the {@link MeshComponentData.geometry.cylinderParams} property
 *
 * See {@link https://threejs.org/docs/#api/en/geometries/CylinderGeometry | CylinderGeometry}
 */
export interface CylinderParamsData {
    radiusTop: number;
    radiusBottom: number;
    height: number;
    radialSegments: number;
    heightSegments: number;
    openEnded: boolean;
}
