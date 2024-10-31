/**
 * @internal
 *
 * A help class to generate deterministic rpc ids
 * when duplicating or instantiating a prefab
 */
export class NetIds {
    //
    private static map: WeakMap<any, Record<string, number>> = new WeakMap();

    static nextId(space: any, base: string) {
        //
        let nextByBase = this.map.get(space);

        if (!nextByBase) {
            nextByBase = {};
            this.map.set(space, nextByBase);
        }

        nextByBase[base] ??= 0;

        return `${nextByBase[base]++}`;
    }
}
