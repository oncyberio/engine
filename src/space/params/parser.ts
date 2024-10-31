import { TransformConfigOpts } from "engine/abstract/componentinfo";
import { getParams, getRpcMethods, ScriptParam } from "./decorators";
import { Component3D } from "engine/scripting";
import { ScriptProp } from "./props";
import { IS_EDIT_MODE } from "engine/constants";

export interface ParamsConfig {
    data: any;
    params: Array<{ key: string; param: ScriptParam }>;
    props: Record<string, ScriptProp>;
    valuePaths: string[];
    rpcMethods?: Record<string, any>;
    netState: ScriptProp;
}

const defaultFolder = {
    label: "Parameters",
};

export class ParamsParser {
    //

    static getInstanceGui(instance: any) {
        //
        const config = this.getConfig(instance);

        if (!config?.params?.length) {
            //
            return null;
        }

        const topGroup = { type: "group", children: {} } as any;

        this.getParamsGUI(instance, config, [topGroup]);

        let fstChild = topGroup.children[Object.keys(topGroup.children)[0]];

        if (fstChild.type !== "folder") {
            //
            topGroup.type = "folder";
            topGroup.label = "Parameters";
        }

        return topGroup;
    }

    private static _configCache = new WeakMap();

    static getConfig(instance: Component3D, autoCreate = true): ParamsConfig {
        //
        const key = instance;

        let config = this._configCache.get(key);

        if (!config && autoCreate) {
            //
            config = this.createConfig(instance);

            this._configCache.set(key, config);
            //
        } else {
            //
            // console.log("yolooo has already", instance, config);
        }

        return config;
    }

    private static createConfig(instance: Component3D) {
        //
        let result: ParamsConfig = {
            params: null,
            props: {},
            data: null,
            valuePaths: [],
            rpcMethods: getRpcMethods(instance),
            netState: null,
        };

        result.params = getParams(instance, false);

        if (result.params?.length) {
            //
            result.params.forEach(({ key, param }) => {
                //
                let transient = key == "netState";

                let prop = ScriptProp.create({
                    param,
                    transient,
                });

                if (key === "netState") {
                    result.netState = prop;
                } else {
                    result.props[key] = prop;
                }
            });

            result.params = result.params.filter(
                ({ key }) => key !== "netState"
            );
            result.data = this.getDefaultData(instance, result.props);

            result.valuePaths = this.getValuePaths(result.params);

            if (!IS_EDIT_MODE && result.netState) {
                result.data ??= {};
                result.data.netState = result.netState.getDefaultData();
                result.valuePaths.push("netState");
            }
        }

        return result;
    }

    private static getValuePaths(
        params: Array<{ key: string; param: ScriptParam }>
    ): string[] {
        //
        const paths = [];

        params.forEach(({ key, param }) => {
            //
            if (param.type === "group") {
                //
                const subPaths = this.getValuePaths(param.children);

                subPaths.forEach((path) => {
                    //
                    paths.push(`${key}.${path}`);
                });
            } else {
                //
                paths.push(key);
            }
        });

        return paths;
    }

    private static getDefaultData(
        instance: Component3D,
        props: Record<string, ScriptProp>
    ) {
        //
        let result = null;

        Object.keys(props).forEach((key) => {
            //
            result ??= {};

            const prop = props[key];

            let def = prop.getDefaultData();

            if (def !== undefined) {
                result[key] = def;
            }
        });

        if (instance.info?.transform) {
            //
            result ??= {};

            Object.assign(
                result,
                this._getTransformData(instance.info.transform)
            );
        }

        return result;
    }

    private static _getTransformData(trOpt: TransformConfigOpts) {
        //
        const res: any = {};

        if (!trOpt) return res;

        if (trOpt === true) {
            //
            trOpt = { position: true, rotation: true, scale: true };
        }

        if (trOpt.position) {
            //
            res.position = { x: 0, y: 0, z: 0 };
        }

        if (trOpt.position) {
            //
            res.rotation = { x: 0, y: 0, z: 0 };
        }

        if (trOpt.position) {
            //
            res.scale = { x: 1, y: 1, z: 1 };
        }

        return res;
    }

    private static getParamsGUI(
        instance: Component3D,
        config: ParamsConfig,
        groupStack?: any[]
    ) {
        //
        const gui = {};

        Object.keys(config.props).forEach((key) => {
            //
            const prop = config.props[key];

            let propGui = prop.onGetGui({
                host: instance,
                key,
                path: [key],
            });

            gui[key] = propGui;
        });

        return this._groupParams(gui, config.params, groupStack);
    }
    /*
    private static constructLayout(layout: any, params: Record<string, any>) {
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
        */

    private static _groupParams(
        gui: Record<string, any>,
        params: ParamsConfig["params"],
        groupStack: any[]
    ) {
        //
        params.forEach(({ key, param }, i) => {
            //
            let paramGroup = param.group as any;

            if (typeof paramGroup === "string") {
                //
                paramGroup = { label: paramGroup };
            }

            if (paramGroup?.start) {
                //
                let currentGroup = groupStack[groupStack.length - 1];

                let newGroup = {
                    type: "folder",
                    label: paramGroup.label,
                    children: {},
                };

                currentGroup.children[paramGroup.label] = newGroup;

                groupStack.push(newGroup);
                //
            }

            if (paramGroup?.end) {
                // End the current nested group
                if (groupStack.length > 1) {
                    groupStack.pop();
                }
                //
            }

            if (paramGroup?.label && !paramGroup?.start) {
                //
                let newGroup = {
                    type: "folder",
                    label: paramGroup.label,
                    children: {},
                };

                if (groupStack.length > 1) {
                    groupStack.pop();
                }

                groupStack[groupStack.length - 1].children[paramGroup.label] =
                    newGroup;

                groupStack.push(newGroup);
            }

            const currentGroup = groupStack[groupStack.length - 1];

            currentGroup.children[key] = gui[key];
        });
    }
}

// globalThis["ParamsParser"] = ParamsParser;
