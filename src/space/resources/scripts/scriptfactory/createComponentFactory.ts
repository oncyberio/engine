// @ts-check

import { DefaultComponentFactory } from "engine/abstract/defaultcomponentfactory";
import { ScriptResource } from "engine/space/resources/scripts/scriptresource";
import { ScriptHost } from "./scripthost";
import { ComponentFactoryOptions } from "engine/abstract/componentfactory";
import { ComponentInfo } from "engine/abstract/componentinfo";
import { ScriptComponent } from "../api/scriptcomponent";
import { IS_EDIT_MODE } from "engine/constants";
import { OPTS } from "engine/abstract/component3D";
import { reconcileData } from "engine/space/shared/reconciledata";

const defaultMeta = {
    title: "Script",
    image: "https://res.cloudinary.com/ugc-oo-oo/image/upload/v1722271320/290704-prefabs.png",
    singleton: false,
    priority: 11,
};

// function inherits(childClass, parentClass) {
//     //
//     let prototype = Object.getPrototypeOf(childClass.prototype);

//     while (prototype !== null) {
//         //
//         if (prototype === parentClass.prototype) {
//             return true;
//         }

//         prototype = Object.getPrototypeOf(prototype);
//     }

//     return false;
// }

export function createScriptComponentFactory(module: ScriptResource) {
    //
    return class ScriptComponentFactory extends DefaultComponentFactory<any> {
        //
        Type = null as any;

        private static _info = this._getInfo();

        static get info() {
            //
            return this._info;
        }

        static _getInfo() {
            //
            return {
                batchDraw: false,
                ...defaultMeta,
                ...module.meta,
                custom: true,
                priority: module.isMain ? 1 : 11,
                kind: "script",
            } as ComponentInfo;
        }

        /**
         * @internal
         *
         * Called when the module of the script resource is changed.
         */
        static async _patchMeta() {
            //
            this._info = this._getInfo();

            const defaultData = module.getDefaultComponentData();

            this.dataSchema.setDefaultData(defaultData);

            this.dataSchema.setValuesPaths(module.getValuePaths());

            this.baseDataWrapper.setOwnData(this.dataSchema.getDefaultData());
        }

        static getTitle(data) {
            return this.info.title;
        }

        static {
            //
            const defaultData = module.getDefaultComponentData();

            const valuePaths = module.getValuePaths();

            this.createDataWrapper({
                valuePaths,
                defaultData,
            });
        }

        private _klass: any;

        private _isStandalone = false;

        async init(opts: ComponentFactoryOptions) {
            //
            this._klass = module.klass;

            this._isStandalone = ScriptComponent.prototype.isPrototypeOf(
                this._klass.prototype
            );

            if (typeof this._klass.onModuleInit === "function") {
                //
                await this._klass.onModuleInit();
            }
        }

        dispose() {
            //
            //
            if (typeof this._klass.onModuleDispose === "function") {
                //
                this._klass.onModuleDispose();
            }

            this._isStandalone = false;

            this._klass = null;
        }

        onGetDefInstanceData(data) {
            //
            let defData = super.onGetDefInstanceData(data);

            if (typeof this._klass.onGetInstanceData === "function") {
                //
                let instanceData = this._klass.onGetInstanceData(data) ?? {};

                defData = {
                    ...defData,
                    ...instanceData,
                };
            }

            return defData;
        }

        private async _createStandalone(opts) {
            //
            const instance = new this._klass(opts);

            await instance.onInit();

            return instance;
        }

        private async _createHost(opts) {
            //
            const instance = new ScriptHost(opts);

            await instance.onInit();

            return instance;
        }

        private _getInstanceOpts(data) {
            //
            const scriptFactory = this.opts.space.resources.scriptFactory;

            const emitter = scriptFactory.emitter;

            return {
                space: this.space,
                container: this.container,
                info: this.info,
                data,
                module,
                emitter,
                disabled: this.opts.disableScripts,
            };
        }

        private async _initInstance(data) {
            //
            const opts = this._getInstanceOpts(data);

            return this._isStandalone
                ? this._createStandalone(opts)
                : this._createHost(opts);
        }

        async createInstance(data) {
            //

            const instance = await this._initInstance(data);

            if (IS_EDIT_MODE) {
                //
                return mimic(instance);
            }

            return instance;
        }

        async _patch(opts: { instances: ScriptHost[] }) {
            //

            if (!IS_EDIT_MODE) return;

            this.dispose();

            await this.init(this.opts);

            await Promise.all(
                opts.instances.map(async (proxyInstance) => {
                    //
                    const prevParams = (proxyInstance as any)._paramsBinder
                        .config.params;

                    const nextParams = module._params;

                    const newData = reconcileData({
                        data: structuredClone(proxyInstance.ownData),
                        newData: module.getDefaultComponentData(),
                        prevParams,
                        nextParams,
                        isDerived: proxyInstance.ownData.prefabId != null,
                    });

                    const oldInstance = proxyInstance[TARGET];

                    const prevChildComponents =
                    oldInstance.childComponents.filter(
                        (c) => c.isPersistent
                    );

                    prevChildComponents.forEach((child) => {
                        child.parent.remove(child)
                    })

                    const userData = oldInstance.userData;

                    const parent = oldInstance.parent;

                    const isPersistent = oldInstance[OPTS].persistent;

                    oldInstance._onDispose();
                    
                    const newInstance = await this._initInstance(newData);

                    newInstance[OPTS].persistent = isPersistent
                    
                    newInstance.parent = parent;

                    prevChildComponents.forEach((child) => {
                        //
                        newInstance.add(child);
                    });

                    newInstance.userData = userData;

                    newInstance.updateMatrixWorld(true);

                    (proxyInstance as any)[SET_TARGET](newInstance);

                    newInstance.emit(
                        newInstance.EVENTS.CHILDREN_LOADED,
                        newInstance.childComponents
                    );

                    if (newInstance.parentComponent) {
                        //
                        newInstance.parentComponent.emit(
                            newInstance.parentComponent.EVENTS.CHILDREN_LOADED,
                            newInstance.parentComponent.childComponents
                        );
                    }

                    newInstance._isLoading = false;
                })
            );
        }
    };
}

const TARGET = Symbol("@oo/target");

const SET_TARGET = Symbol("@oo/setTarget");

function mimic(target: ScriptHost) {
    //
    const wrapper = {
        target,
        [SET_TARGET](newTarget) {
            //wrapper.target._onDispose();
            wrapper.target = newTarget;
            console.log(`Target swapped to:`, newTarget);
        },
    };

    return new Proxy(wrapper, {
        get(wrapper, prop, receiver) {
            if (prop === TARGET) {
                return wrapper.target;
            }

            if (prop === SET_TARGET) {
                return wrapper[SET_TARGET].bind(wrapper);
            }

            return Reflect.get(wrapper.target, prop, wrapper.target);
        },
        set(wrapper, prop, value, receiver) {
            return Reflect.set(wrapper.target, prop, value, wrapper.target);
        },
        deleteProperty(wrapper, prop) {
            return Reflect.deleteProperty(wrapper.target, prop);
        },
        has(wrapper, prop) {
            if (prop === "$$setTarget") return true;

            return Reflect.has(wrapper.target, prop);
        },
        ownKeys(wrapper) {
            console.log("Getting own keys");
            return Reflect.ownKeys(wrapper.target);
        },
        getPrototypeOf(wrapper) {
            return Reflect.getPrototypeOf(wrapper.target);
        },
    });
}
