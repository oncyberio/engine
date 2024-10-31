import { deepEqual, isObject } from "utils/js";
import { Component3D } from "engine/abstract/types";
import { components } from "../components/components";
import { DataWrapper } from "../datamodel/datawrapper";

export interface PresetOpts {
    data: any;
    wrapper: DataWrapper;
}

export class Preset {
    //
    constructor(public opts: PresetOpts) {}

    apply(canUndo: boolean) {
        //
        let prevData = this.opts.wrapper.extract(this.opts.data);

        this.opts.wrapper.assign(this.opts.data);

        if (!canUndo) return null;

        return {
            undo: async () => {
                //
                this.opts.wrapper.assign(prevData);
            },
            redo: async () => {
                //
                this.opts.wrapper.assign(this.opts.data);
            },
        };
    }

    isApplied() {
        //
        return this.opts.wrapper.includes(this.opts.data);
    }
}
