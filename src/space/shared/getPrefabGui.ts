import { Component3DEditor } from "./uieditor";

// Unused since prefab button has been added to global toolbar
export function createPrefabGUI(editor: Component3DEditor) {
    const onCreatePrefab = (val) => {
        if (val == true) {
            editor.createPrefab();
        } else {
            editor.detachPrefabInstance();
        }
    };
    return {
        prefab: {
            type: "checkbox",
            label: "Prefab",
            info: "Converting an item or group into a prefab makes it reusable. Press P to convert and Shift + P to undo.",
            value: () => !!editor.data.prefabId,
            onChange: onCreatePrefab,
        },
    };
}
