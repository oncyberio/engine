import { DataWrapper } from "engine/space/datamodel/datawrapper";
import { AbstractLens } from "./abstract";

/**
 * When editing guis sometimes we don't want to edit the data directly.
 * instead we want to edit a view of the data.
 *
 * Examples:
 * - avatar component: has data.rotation, but we want to edit only data.rotation.y
 * - colliderUI: collider.rotationLock is a [boolean, boolean, boolean], but we want to edit it as a single boolean
 *
 * A view interface can be plugged into the dataWrapper lens to intercept get/set operations
 * and transform the data as needed.
 *
 * Why do we need this?
 *
 * Because DataWrapperLens implements support for apply/reset operations for prefabs in a way
 * that supports undo/redo; and we don't want to reimplement this logic every time we have a lens
 * that just views/alters the data in a different way.
 */
export interface DataLensView<S = any, T = any> {
    onGet(value: S): T;
    onSet(value: T, prev: S): S;
    isOverride?(wrapper: DataWrapper, path: string): boolean;
}

export class DataWrapperLens<S = any> extends AbstractLens {
    //
    private pathAsStr: string;

    readonly transient = true;

    constructor(
        public wrapper: DataWrapper,
        public path: string[],
        public view?: DataLensView
    ) {
        //
        super();

        this.componentId = wrapper.data.id;

        this.pathAsStr = path.join(".");
    }

    get() {
        //
        let val = this.wrapper.get(this.path);

        if (this.view != null) {
            //
            val = this.view.onGet(val);
        }

        return val;
    }

    getOwn() {
        //
        let val = this.wrapper.getOwnValue(this.path);

        if (this.view != null) {
            //
            val = this.view.onGet(val);
        }

        return val;
    }

    set(value: any) {
        // optimization
        if (this.view != null) {
            //
            value = this.view.onSet(value, this.wrapper.get(this.path));
        }

        if (
            value == null &&
            this.wrapper._dataSchema._valuePaths[this.pathAsStr]
        ) {
            //
            this.reset();
            //
        } else {
            //
            this.wrapper.set(this.path, value);
        }
    }

    reset() {
        //
        this.wrapper.unset(this.path);
    }

    apply() {
        //
        // const oldBaseValue = this.wrapper.base.getOwnValue(this.path);

        // const curValue = this.wrapper.getOwnValue(this.path);

        // this.wrapper.base.set(this.path, curValue);

        // this.wrapper.unset(this.path);

        // return { __OP__: "apply", baseValue: oldBaseValue, ownValue: curValue };

        return this.wrapper.applyOverrides([this.pathAsStr]);
    }

    unapply(state: any) {
        //
        // if (state?.__OP__ !== "apply") {
        //     //
        //     throw new Error("Invalid state");
        // }

        // if (state.baseValue !== undefined) {
        //     //
        //     this.wrapper.base.set(this.path, state.baseValue);
        //     //
        // } else {
        //     //
        //     this.wrapper.base.unset(this.path);
        // }

        // this.wrapper.set(this.path, state.ownValue);

        this.wrapper.unapplyOverrides(state);
    }

    get isLocked() {
        //
        return this.wrapper.data.lock?.[this.path[0]];
    }

    get isOverride() {
        //
        if (this.view?.isOverride) {
            //
            return this.view.isOverride(this.wrapper, this.pathAsStr);
        }

        return this.wrapper.isOverride(this.pathAsStr);
    }

    get source() {
        //
        return this.wrapper;
    }

    get prop() {
        //
        return this.pathAsStr;
    }

    withView(view: DataLensView) {
        //
        return new DataWrapperLens(this.wrapper, this.path, view);
    }
}
