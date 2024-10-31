import { isObject } from "engine/utils/js";

export function getUndoChanges(changes: any, currentData: any) {
    //
    let savedData: any = {};

    for (let key in changes) {
        //
        const incoming = changes[key];

        const current = currentData?.[key];

        savedData[key] = current;

        // if (isObject(current)) {
        //     //
        //     if (!isObject(incoming)) {
        //         //
        //         throw new Error("data mismatch at " + key);
        //     }

        //     savedData[key] = getUndoChanges(incoming, current);
        //     //
        // } else {
        //     //
        //     savedData[key] = current;
        // }
    }

    return savedData;
}

export function applyDataChanges(changes: any, currentData: any) {
    //
    for (let key in changes) {
        //
        const incoming = changes[key];

        currentData[key] = incoming;
    }
}

export function getDataChangeCommand(
    changes: any,
    data: any,
    canUndo: boolean,
) {
    //
    let prevData = getUndoChanges(changes, data);

    return {
        async run() {
            //
            applyDataChanges(changes, data);

            if (!canUndo) return null;

            return {
                undo: async () => {
                    //
                    applyDataChanges(prevData, data);
                },
                redo: async () => {
                    //
                    applyDataChanges(changes, data);
                },
            };
        },
        source: data,
        changes,
    };
}
