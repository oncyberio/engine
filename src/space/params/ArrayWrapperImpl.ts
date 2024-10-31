import { DescCtx, Descriptor, ScriptProp } from "./props";

//

export class ArrayParamImpl {
    //
    descriptors: Descriptor[] = [];

    constructor(
        public array: Array<any>,
        public itemProp: ScriptProp<any, any, any>,
        public onUpdateData: (fn: (arrData: any[]) => any[]) => void
    ) {
        //
        const methods = this.getOverrideMetods();

        for (let key in methods) {
            //
            Object.defineProperty(this.array, key, {
                value: methods[key],
                writable: false,
                configurable: true,
            });
        }
    }

    updateData(fn: (arrData: any[]) => any[]) {
        //
        this.onUpdateData(fn);
    }

    serialize(item: any) {
        //
        return this.itemProp.serialize(item);
    }

    syncDescs(ctx: DescCtx, data: any[]) {
        //
        if (!data) {
            console.error("ArrayParamImpl.syncDescs: data is null");
            return;
        }

        for (let i = this.descriptors.length; i < data.length; i++) {
            //
            const desc = this.itemProp.createDescriptor({
                ...ctx,
                key: i,
                path: ctx.path.concat([i]),
            });

            this.descriptors.push(desc);

            Object.defineProperty(this.array, i, {
                ...desc,
                configurable: true,
            });
        }

        for (let i = data.length; i < this.descriptors.length; i++) {
            //
            this.descriptors.pop();

            delete this.array[i];
        }

        this.array.length = data.length;
    }

    getOverrideMetods() {
        return {
            push: (...items: any[]) => {
                //
                this.updateData((arr) => {
                    //
                    const dataItems = items.map((it) => {
                        //
                        return this.serialize(it);
                    });

                    return arr.concat(dataItems);
                });

                return this.array.length;
            },

            pop: () => {
                //
                const val = this[this.array.length - 1];

                this.updateData((arr) => arr.slice(0, arr.length - 1));

                return val;
            },

            shift: () => {
                //
                const val = this[0];

                this.updateData((arr) => arr.slice(1));

                return val;
            },

            unshift: (...items: any[]) => {
                //
                this.updateData((arr) => {
                    //
                    const dataItems = items.map((it) => {
                        //
                        return this.serialize(it);
                    });

                    return dataItems.concat(arr);
                });

                return this.array.length;
            },

            splice: (start: number, deleteCount?: number, ...rest: any[]) => {
                //
                const deleted = this.array.splice(start, deleteCount, ...rest);

                const dataItems = rest.map((it) => {
                    //
                    return this.serialize(it);
                });

                this.updateData((arr) => {
                    //
                    const newArr = arr.slice();

                    newArr.splice(start, deleteCount, ...dataItems);

                    return newArr;
                });

                return deleted;
            },

            sort: (compareFn?: (a: any, b: any) => number) => {
                //
                return this;
            },

            fill: (value: any, start?: number, end?: number) => {
                //
                const dataValue = this.serialize(value);

                this.updateData((arr) => {
                    //
                    const newArr = arr.slice();

                    newArr.fill(dataValue, start, end);

                    return newArr;
                });

                return this;
            },

            copyWithin: (target: number, start: number, end?: number) => {
                //
                this.updateData((arr) => {
                    //
                    const newArr = arr.slice();

                    newArr.copyWithin(target, start, end);

                    return newArr;
                });

                return this;
            },

            reverse: () => {
                //
                this.updateData((arr) => {
                    //
                    return arr.slice().reverse();
                });

                return this;
            },
        };
    }

    /*
    insertEntries(start: number, nb: number) {
        //
        const newDescs = [];

        for (let i = 0; i < nb; i++) {
            //
            const desc = this.callbacks.createProp(start + i);

            newDescs.push(desc);
        }

        if (start === this.descriptors.length) {
            //
            this.descriptors.push(...newDescs);
        } else {
            //
            this.descriptors.splice(start, 0, ...newDescs);
        }

        this.syncDesc();

        return this.array.length;
    }

    deleteEntries(start: number, nb: number) {
        //
        this.descriptors.splice(start, nb);

        this.syncDesc();
    }

    popEntry() {
        //
        this.descriptors.pop();

        this.syncDesc();
    }
    */
}
