import { IS_EDIT_MODE } from "engine/constants";
import type { ScriptHost } from "./scripthost";
import { Component3DEditor } from "engine/space/shared/uieditor";
import { Object3D } from "three";

/**
 * @public
 */
export class ScriptEditorCtx {
    //
    constructor(private _impl_: ScriptHost["_impl_"]) {}

    private get _studioEditor() {
        return this._impl_.host.editor?._studioEditor;
    }

    get data() {
        return this._impl_.host.editor.data;
    }

    requestSelection() {
        //
        if (!IS_EDIT_MODE) return;

        Component3DEditor.requestSelection(this._impl_.host.data.id);
    }

    commitUpdates() {
        //
        if (!IS_EDIT_MODE) return;

        this._impl_.host.editor?._commitUpdates();
    }

    attachTransfomControls(
        object: Object3D,
        opts: {
            callbacks?: {
                onDragStart?: () => void;
                onDragEnd?: () => void;
                onDrag?: () => void;
            };
            translate?: boolean;
            rotate?: boolean;
            scale?: boolean;
        }
    ) {
        //
        this._impl_.host.editor?.attachTransfomControls(object, opts);
    }

    enableTransformControls() {}

    disableTransformControls() {}
}
