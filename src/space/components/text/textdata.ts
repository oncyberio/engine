import { Component3DData } from "engine/abstract/component3Ddata";
import { XYZ } from "../types";

/**
 * @public
 */
export type FontFamily =
    | "aeonik-bold"
    | "aeonik-medium"
    | "playfair-regular"
    | "playfair-italic";

/**
 * @public
 */
export type TextAlignment = "left" | "center" | "right";

/**
 * @public
 */
export type TextTransform =
    | "none"
    | "uppercase"
    | "lowercase"
    | "capitalize"
    | "togglecase";

/**
 * @public
 *
 * Data specification for {@link TextComponent}, see {@link ComponentManager.create} on how to create a component
 */
export interface TextComponentData extends Component3DData {
    /**
     * @internal
     */
    kit?: "cyber";

    type: "text";

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
     */
    rotation?: XYZ;

    /**
     * Scale of the component in the space. Defaults to {x: 1, y: 1, z: 1}
     */
    scale?: XYZ;

    /**
     * Text to display
     */
    text: string;

    /**
     * Font to use
     */
    font?: FontFamily;

    /**
     * Width of the text box. Defaults to 500. Use this to avoid breaking a long into multiple lines
     */
    width?: number;

    /**
     * Line height of the text. Defaults to 60
     */
    lineHeight?: number;

    /**
     * Color of the text. Defaults to "#ffffff"
     */
    textColor?: string;

    /**
     * How text should be aligned. Defaults to "left"
     */
    align?: TextAlignment;

    /**
     * Optional transform to apply to the text. Defaults to "none"
     */
    textTransform?: TextTransform;

    /**
     * Opacity of the text. Defaults to 1
     */
    opacity?: number;

    /**
     * Whether the text should use instancing. Defaults to false
     */
    instanced?: boolean;

    /**
     * Whether the text should use billboardind when instanced. Defaults to true
     */
    instancedBillBoard?: boolean;
}
