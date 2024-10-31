import { Component3DEditor } from "engine/space/shared/uieditor";
import { ScriptHost } from "./scripthost";
import { getTransformUI } from "engine/space/shared/transformui";
import { ParamsParser } from "engine/space/params";
import { Intersection, Mesh } from "three";

export class ScriptComponentEditor extends Component3DEditor<ScriptHost> {
    //
    getDataContext() {
        //
        return this.component.instance;
    }

    get config() {
        // @ts-ignore
        return this.component._impl_.module.config;
    }

    private _createTransformUI() {
        //
        const trOpts = Component3DEditor._toTrUI(this.config.transform);

        const transform = trOpts ? getTransformUI(this, trOpts) : null;

        return transform;
    }

    private _createParamsUI() {
        //
        return ParamsParser.getInstanceGui(this.component.instance);
    }

    guis = {
        transform: this._createTransformUI(),
        params: this._createParamsUI(),
    };

    getGUI() {
        //
        let params = (this.component as any).onGetGui?.();

        return {
            type: "group",
            children: {
                transform: this.guis.transform,
                params: params ?? this.guis.params,
            },
        };
    }

    getDetailMeshes() {
        //
        return this.component.instance?.onEditorGetMeshes?.();
    }

    onDetailMeshClicked(mesh: Mesh, intersect: Intersection<Mesh>): void {
        //
        this.component.instance.onEditorMeshClicked(mesh, intersect);
    }

    onDetailMeshMouseEnter(mesh: Mesh, intersect: Intersection<Mesh>): void {
        //
        this.component.instance.onEditorMeshMouseEnter(mesh, intersect);
    }

    onDetailMeshMouseLeave(mesh: Mesh): void {
        //
        this.component.instance.onEditorMeshMouseLeave(mesh);
    }
}
