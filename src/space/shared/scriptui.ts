import type { ScriptComponentEditor } from "../resources/scripts/scriptfactory/scripteditor";

//
export function getScriptParamsGUI(scriptEditor: ScriptComponentEditor) {
    //
    const config = scriptEditor.config as any;
    const data = scriptEditor.data;

    if (config == null) {
        return null;
    }

    const params = config.params;

    const meta = {};

    Object.keys(params).forEach((key) => {
        const param = params[key];
        meta[key] = getParamUI(scriptEditor, key, param, data);
    });

    if (config.layout) {
        //
        return constructLayout(config.layout, meta);
        //
    } else {
        return groupParams(meta, { label: "Parameters" });
    }
}

/**
 * example layout:
 *  {
        transform: {
            children: ["position", "rotation", "scale"],
        },
        appearance: {
            children: ["opacity"]
        }
    }

    group flat params into folders
 */
function constructLayout(layout: any, params: Record<string, any>) {
    //
    const result = {};

    Object.keys(layout).forEach((key) => {
        //
        const group = layout[key];

        const folder = {
            type: "folder",
            label: group.label ?? formatLabel(key),
            children: {},
        };

        group.children.forEach((child) => {
            //
            folder.children[child] = params[child];
        });

        result[key] = folder;
    });

    return {
        type: "group",
        children: result,
    };
}

/**
 * In this setting, params are like
 * { type: "position", group: "transform" }
 * { type: "rotation" }
 * ...
 *
 * {type: "opacity", group: "appearance"}
 * ...
 *
 * We need to group the params by the last seen group
 */
function groupParams(
    params: Record<string, any>,
    defaultGroup: { label: string }
) {
    //
    const result = {};

    let currentGroup = defaultGroup;

    Object.keys(params).forEach((key) => {
        //
        const param = params[key];

        currentGroup = param.group ?? currentGroup;

        const group =
            typeof currentGroup == "string"
                ? { label: currentGroup }
                : currentGroup;

        const groupKey = group.label;

        if (!result[groupKey]) {
            //
            result[groupKey] = {
                ...group,
                type: "folder",
                label: groupKey,
                children: {},
            };
        }

        result[groupKey].children[key] = param;
    });

    return {
        type: "group",
        children: result,
    };
}

// camelCase to Camel Case
function formatLabel(str: string) {
    return str.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}

function getParamUI(
    scriptEditor: ScriptComponentEditor,
    key: string,
    param: any,
    data: any
) {
    //
    let type = param.type;

    let label = param.label ?? param.name ?? formatLabel(key);

    const instance = scriptEditor.component.instance;

    const paramUI = {
        ...param,
        type,
        label,
        value: [data, key],
    }

    switch (paramUI.type) {
        case "string":
        case "text":
            break;
        case "number":
            break;
        case "boolean":
        case "checkbox":
            break;
        case "color":
            break;
        case "vec3":
        case "vec2":
        case "xyz":
            paramUI.type = "xyz";
            break;
        case "select":
            break;
        case "image":
            break;
        case "button":
            paramUI.onAction = () => {
                //
                instance[param.methodKey]?.();

                scriptEditor._commitUpdates();
            };
            break;
        case "presets":
            break;
        default:
            throw new Error("Invalid param type");
    }

    return paramUI;
}
