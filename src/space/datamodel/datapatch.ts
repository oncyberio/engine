export interface AddPatch {
    op: "add";
    path: string[];
    value: any;
}

export interface RemovePatch {
    op: "remove";
    path: string[];
    prevValue: any;
}

export interface ReplacePatch {
    op: "replace";
    path: string[];
    value: any;
    prevValue: any;
}

export type DataPatchListener = (
    patches: DataPatch[],
    inversePatch: DataPatch[]
) => void;

export type DataPatch = AddPatch | RemovePatch | ReplacePatch;

export function getInversePatch(patch: DataPatch): DataPatch {
    //
    if (patch.op === "add") {
        //
        return {
            op: "remove",
            path: patch.path,
            prevValue: patch.value,
        };
    }

    if (patch.op === "remove") {
        //
        return {
            op: "add",
            path: patch.path,
            value: patch.prevValue,
        };
    }

    if (patch.op === "replace") {
        //
        return {
            op: "replace",
            path: patch.path,
            value: patch.prevValue,
            prevValue: patch.value,
        };
    }
}

export function getPatchFromSet(
    path: string[],
    value: any,
    prevValue: any
): DataPatch {
    let patch: DataPatch;

    if (prevValue === undefined) {
        //
        return {
            op: "add",
            path,
            value,
        };
    } else {
        //
        return {
            op: "replace",
            path,
            value,
            prevValue,
        };
    }
}

export function getPatchFromUnset(path: string[], prevValue: any): DataPatch {
    //
    return {
        op: "remove",
        path,
        prevValue,
    };
}
