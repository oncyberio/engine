import { Component3DEditor } from "./uieditor";
import { XYZ } from "../components/types";
import { MathUtils } from "three";

export type XYZOpts = object;

export interface TransformUIOpts {
    position?: XYZOpts;
    rotation?: XYZOpts;
    scale?: XYZOpts;
}

export const DEFAULT_OPTS = {
    position: {},
    rotation: {},
    scale: {},
};

export function getTransformUI(
    editor: Component3DEditor,
    opts: TransformUIOpts = DEFAULT_OPTS
) {
    //
    let ui = {
        type: "folder",
        label: "Transform",
        children: {} as any,
    };

    if (opts.position || opts.scale) {
        ui.children.position = getPositionScaleUI(editor, opts);
    }

    if (opts.rotation) {
        ui.children.rotation = getRotationUI(editor, opts.rotation);
    }

    return ui;
}

export function getPositionScaleUI(
    editor: Component3DEditor,
    opts: TransformUIOpts = DEFAULT_OPTS
) {
    let ui = {
        type: "group",
        label: "Transform",
        slug: "position",
        children: {} as any,
    };

    if (opts.position != null) {
        ui.children.position = {
            type: "xyz",
            value: [editor.data, "position"],
            locked: () => editor.data.lock?.position,
            ...opts.position,
        };
    }

    if (opts.scale) {
        ui.children.scale = {
            type: "xyz",
            value: [editor.data, "scale"],
            step: 0.1,
            locked: () => editor.data.lock?.scale,
            ...opts.scale,
        };
    }

    return ui;
}

function xyzDegreesToRadians(value: XYZ) {
    return {
        x: MathUtils.degToRad(value.x),
        y: MathUtils.degToRad(value.y),
        z: MathUtils.degToRad(value.z),
    };
}

function xyzRadiansToDegrees(value: XYZ) {
    return {
        x: MathUtils.radToDeg(value.x),
        y: MathUtils.radToDeg(value.y),
        z: MathUtils.radToDeg(value.z),
    };
}

const rotationFormat = {
    parse(value: XYZ) {
        return xyzDegreesToRadians(value);
    },
    format(value: XYZ) {
        return xyzRadiansToDegrees(value);
    },
};

export function getRotationUI(editor: Component3DEditor, opts: object = {}) {
    return {
        type: "group",
        label: "Rotation",
        slug: "rotation",
        children: {
            rotation: {
                type: "xyz",
                value: [editor.data, "rotation"],
                format: rotationFormat,
                locked: () => editor.data.lock?.rotation,
                ...opts,
            },
        },
    };
}
