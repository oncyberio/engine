import { hasOwn } from "engine/utils/js";
import { ScriptParam } from "../params";

const reservedCDataKeys: Record<string, boolean> = {
    id: true,
    kind: true,
    type: true,
    kit: true,
    name: true,
    collider: true,
    script: true,
    parentId: true,
    prefabId: true,
    children: true,
    _index: true,
};

export function reconcileData(opts: {
    data: any;
    newData: any;
    prevParams: any;
    nextParams: any;
    isDerived?: boolean;
}) {
    //
    Object.keys(opts.newData).forEach((key) => {
        //
        const newVal = opts.newData[key];

        const exists = hasOwn(opts.data, key);

        if (!exists) {
            //
            if (!opts.isDerived) {
                opts.data[key] = newVal;
            }

            return;
        }

        const prevParam = getParam(key, opts.prevParams);

        const nextParam = getParam(key, opts.nextParams);

        //
        if (!sameParamType(prevParam, nextParam)) {
            //
            opts.data[key] = newVal;
            //
        } else if (prevParam?.type === "group") {
            //
            reconcileData({
                data: opts.data[key],
                newData: newVal,
                prevParams: prevParam.children,
                nextParams: nextParam.children,
                isDerived: opts.isDerived,
            });
        } else if (prevParam?.type === "array") {
            //
            const oldLen = opts.data[key].length;

            const newLen = newVal.length;

            if (newLen > oldLen) {
                //
                opts.data[key] = opts.data[key].concat(newVal.slice(oldLen));
            }
        }
    });

    //
    Object.keys(opts.data).forEach((key) => {
        //
        if (!hasOwn(opts.newData, key) && !reservedCDataKeys[key]) {
            //
            delete opts.data[key];
        }
    });

    return opts.data;
}

function getParam(key, params) {
    //
    return params.find((param) => param.key === key)?.param;
}

function sameParamType(prev: ScriptParam, next: ScriptParam) {
    //
    if (prev?.type === "array" && next?.type === "array") {
        //
        return sameParamType(prev.itemParam, next.itemParam);
    }
    if (prev?.type === "union" && next?.type === "union") {
        //
        return (
            prev.options.length !== next.options.length &&
            prev.options.every(
                (option, i) =>
                    option.tag === next.options[i].tag &&
                    sameParamType(option.value, next.options[i].value)
            )
        );
    }

    if (prev?.type === "map" && next?.type === "map") {
        //
        return sameParamType(prev.itemParam, next.itemParam);
    }

    return prev?.type === next?.type;
}
