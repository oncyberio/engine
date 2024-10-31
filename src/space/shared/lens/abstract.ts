//

export class AbstractLens<T = any> {
    //
    componentId: string;

    get(): T {
        throw "abstrct";
    }

    getOwn(): T {
        //
        throw "abstract";
    }

    set(value: T, opts?: { isProgress: boolean }): unknown {
        //
        throw "abstract";
    }

    reset() {
        //
        throw "abstract";
    }

    apply() {
        //
        throw "abstract";
    }

    unapply(state: any) {
        //
        throw "abstract";
    }

    get source() {
        //
        return null;
    }

    get prop() {
        //
        return null;
    }

    get isOverride() {
        //
        return false;
    }

    get isLocked() {
        //
        return false;
    }
}

// an object that has the Same shape as Partial<AbstractLens>
export type LensLike<T = any> = Partial<{
    get(): T;
    getOwn(): T;
    set(value: T, opts?: { isProgress: boolean }): unknown;
    reset(): void;
    apply(): void;
    unapply(state: any): void;
    source: any;
    prop: any;
    isOverride: boolean;
    isLocked: boolean;
}>;
