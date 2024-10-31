import { DataWrapper } from "engine/space/datamodel/datawrapper";
import { AbstractLens } from "./abstract";

interface LensPart {
    key: string;
    optional: boolean;
}

export class PathLens<S = any, T = any> extends AbstractLens<T> {
    //

    data: DataWrapper;

    object: S;

    path: Array<LensPart>;

    constructor({ data, object, path }) {
        //
        super();

        this.componentId = data?.id;

        this.data = data;

        this.object = object;

        this.path = path.map((key) => {
            if (key.endsWith("?")) {
                return {
                    key: key.slice(0, -1),
                    optional: true,
                };
            } else {
                return {
                    key,
                    optional: false,
                };
            }
        });
    }

    private _getProp() {
        //
        let curr: any = this.object;

        for (let i = 0; i < this.path.length; i++) {
            //
            const prop = this.path[i];

            if (curr === null || typeof curr !== "object") {
                return undefined;
            }

            curr = curr[prop.key];
        }

        return curr;
    }

    private _setProp(value: T) {
        //
        let curr: any = this.object;

        for (let i = 0; i < this.path.length - 1; i++) {
            //
            let prop = this.path[i];

            if (!(prop.key in curr)) {
                //
                if (prop.optional) {
                    //
                    curr[prop.key] = {};
                    //
                } else {
                    //
                    throw new Error(
                        `Path not found: ${this.path.slice(0, i + 1).join(".")}`
                    );
                }
            }

            curr = curr[prop.key];
        }

        const last = this.path[this.path.length - 1];

        curr[last.key] = value;
    }

    get() {
        //
        return this._getProp();
    }

    getOwn() {
        //
        return this._getProp();
    }

    set(value: T) {
        //
        this._setProp(value);
    }

    get source() {
        //
        return this.object;
    }

    get prop() {
        //
        return this.path.map((part) => part.key).join(".");
    }
}
