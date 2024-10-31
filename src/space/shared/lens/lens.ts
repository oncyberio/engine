import { AbstractLens, LensLike } from "./abstract";

const noop: any = () => {};

export class Lens<T = any> extends AbstractLens<T> {
    //

    constructor(private _delegate: LensLike<T>) {
        //
        super();
    }

    get() {
        //
        return this._delegate.get?.();
    }

    getOwn() {
        //
        if (typeof this._delegate.getOwn == "function") {
            //
            return this._delegate.getOwn?.();
        }

        return this.get();
    }

    set(value: T, opts?: { isProgress: boolean }) {
        //
        return this._delegate.set?.(value, opts);
    }

    reset() {
        //
        return this._delegate.reset?.();
    }

    apply() {
        //
        return this._delegate.apply?.();
    }

    unapply(state: any) {
        //
        return this._delegate.unapply?.(state);
    }

    get source() {
        //
        return this._delegate.source;
    }

    get prop() {
        //
        return this._delegate.prop;
    }

    get isOverride() {
        //
        return !!this._delegate.isOverride;
    }

    get isLocked() {
        //
        return !!this._delegate.isLocked;
    }
}
