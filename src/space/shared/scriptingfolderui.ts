import { Component3DEditor } from "./uieditor";

export function getScriptingFolderGUI(editor: Component3DEditor) {
    //
    const gui = {
        type: "folder",
        label: "Scripting",
        children: {
            scriptId: {
                type: "text",
                name: "ID",
                nullable: true,
                value: [editor.data, "script", "identifier"],
            },
            scriptTag: {
                type: "text",
                name: "Tag",
                nullable: true,
                value: [editor.data, "script", "tag"],
            },
        },
    };

    return gui;
}
