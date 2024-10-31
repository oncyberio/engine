// @ts-check

import FontMeshFactory from "engine/components/font";

import { Component3D, OPTS } from "engine/abstract/component3D";

// import { components, factoryOptions } from "./components"

import { removeItem } from "engine/utils/js";

import Emitter from "engine/events/emitter";

import Events from "engine/events/events";

import { CType, ComponentTypeMap, CreateComponentArg } from "./components";

import type { ComponentsRegistry } from "../registry";

import { nanoid } from "engine/utils/nanoid";

import { ComponentData } from "engine/@types/game";

import type { Space } from "engine/space/wrapper";

import { COMPONENT_PRIORITY } from "engine/abstract/componentfactory";

import AugmentedGroup from "engine/abstract/augmentedgroup";
import { Object3D } from "three";
import { Deferred, deferred } from "engine/utils/deferred";
import { AvatarComponent } from "./avatar/avatarcomponent";
import { IS_EDIT_MODE, IS_SERVER_MODE } from "engine/constants";

export interface ComponentManagerOpts {
    data: Record<string, ComponentData>;
    kits: Record<string, string>;
    space: Space;
    externalApi: Record<string, any>;
    disableScripts: boolean;
    loadOpts?: {
        looseMode?: boolean;
    };
}

export interface CreateComponentOpts {
    parent?: Component3D;
    abort?: AbortSignal;
    transient?: boolean;
    overrideOpts?: {};
    netId?: string;
    sessionId?: string;
}

interface InternalCreateComponentOpts {
    parent?: Object3D;
    abort?: AbortSignal;
    persistent?: boolean;
    overrideOpts?: {};
    duplicating?: boolean;
    netId?: string;
    sessionId?: string;
}

/**
 *
 *
 * A ComponentManager is a container for all the components of a space.
 * It is responsible for creating, destroying and duplicating components.
 *
 * @public
 */
export class ComponentManager extends AugmentedGroup {
    private _registry: ComponentsRegistry = null;

    /**
     * @internal
     */
    private _dataDict: Record<string, ComponentData>;

    /**
     * some scripts still use this
     */

    /*
     * @internal
     **/
    _isLoading = false;

    private _data: ComponentData[];

    private _components: Component3D[] = [];

    private _postLoadTasks: Promise<any>[] = [];

    private _componentsById: Record<string, Component3D> = {};

    private _componentsByScriptId: Record<string, Component3D> = {};

    private _componentsByScriptTag: Record<string, Component3D[]> = {};

    private _componentsByType: Record<string, Component3D[]> = {};

    private wasDisposed: boolean;

    private _spaceLoaded: Deferred<void> = deferred();

    /**
     * @internal
     */
    constructor(private _opts: ComponentManagerOpts) {
        //
        super();

        this.matrixAutoUpdate = false;

        this._registry = _opts.space.registry;

        _opts.space.add(this);

        this._dataDict = _opts.data;

        this._data = Object.values(_opts.data);

        /** @type { Component3D[] } */
        this._components = [];

        /** @type { Record<string, Component3D> } */
        this._componentsById = {};

        globalThis["ckit"] = this;
    }

    private _nodesPromises: Record<string, Promise<Component3D>> = {};

    private _getPriority(data: ComponentData) {
        //
        const fc = this._registry.factoryClasses[data.type];

        if (fc == null) {
            console.error("factory is null for " + data.type);
            return null;
        }

        return fc.info.priority ?? COMPONENT_PRIORITY.MEDIUM;
    }

    private _canLoad(data: ComponentData) {
        //
        if (__BUILD_TARGET__ === "web") return true;
        const fc = this._registry.factoryClasses[data.type];
        if (fc == null) return null;
        return fc.info.kind !== "script" ? true : fc.info.server;
    }

    get components() {
        return this._components;
    }

    /**
     * @internal
     */
    async _build() {
        //await this.#buildComponentTypes();

        try {
            this._isLoading = true;

            let priorityGroups: ComponentData[][] = [];

            Object.values(this._dataDict).forEach((data) => {
                //
                if (!this._canLoad(data)) return;

                const priority = this._getPriority(data);

                // unkown type
                if (priority == null) return;

                if (priorityGroups[priority] == null) {
                    priorityGroups[priority] = [];
                }

                priorityGroups[priority].push(data);
            });

            await this._buildGroup(priorityGroups[0], 0);

            for (let i = 1; i < priorityGroups.length; i++) {
                await this._buildGroup(priorityGroups[i], i);
            }

            this.emit(Events.GAME_SPACE_LOADED);

            Emitter.emit(Events.GAME_SPACE_LOADED, {
                space: this._opts.space,
            });

            this._spaceLoaded.resolve();

            // Wait for events to be processed, eventually pushing new tasks to the queue
            return new Promise((resolve) => {
                setTimeout(() => {
                    Promise.all(this._postLoadTasks).then(resolve);
                }, 0);
            });
        } finally {
            this._isLoading = false;
        }
    }

    addLoadTask(promise: Promise<any>) {
        this._postLoadTasks.push(promise);
    }

    /**
     * @internal
     */
    async _buildGroup(group: ComponentData[], priority: number, debug = false) {
        // console.log("checking prioty group " + i + " ...");

        if (group == null || group.length === 0) return;

        // console.log("starting prioty group " + i + " ...");

        await Promise.all(
            group.map((data) => {
                if (data.__skipBuild) return;
                //
                let promise = this._getNode(data);

                if (this._opts.loadOpts?.looseMode || IS_EDIT_MODE) {
                    //
                    promise = promise.catch((err) => {
                        console.error(
                            "Error building component " + data.id,
                            err
                        );
                    });
                }

                return promise;
            })
        );

        await this._resolve(priority);

        // console.log(" priority group " + priority + " done ");
    }

    /**
     * @internal
     */
    _upgrades: Array<{ type: "add" | "update"; data: any }> = [];

    private async _buildNode(data: ComponentData) {
        //
        if (data.parentId && this._componentsById[data.parentId] == null) {
            //
            let parentData = this._dataDict[data.parentId];

            let parentFix = false;

            try {
                //
                if (parentData == null) {
                    //
                    console.error(
                        "Can't find parent ",
                        data.parentId,
                        "Trying to fix"
                    );

                    this._dataDict[data.parentId] = parentData = {
                        id: data.parentId,
                        type: "group",
                    };

                    parentFix = true;
                }

                const currentPriority = this._getPriority(data);

                const parentPriority = this._getPriority(parentData);

                // Right now we disallow parenting a child to a parent with a lower priority
                // Later we might want to relax this constraint; we can reparent the child
                // to the parent after the parent has been created. But this will require to
                // solve transform related issues, notably recomputing the colliders dimensions
                if (currentPriority < parentPriority) {
                    //
                    console.error(
                        `Can't parent ${data.id} to ${parentData.id} with a lower priority`
                    );

                    return;
                }

                await this._getNode(parentData);

                if (parentFix) {
                    //
                    const data = this._componentsById[parentData.id].data;

                    this._upgrades.push({
                        type: "add",
                        data,
                    });
                }
                //
            } catch (err) {
                //
                console.error(err.message);
            }
        }

        return this._createInternal(data, { persistent: true });
    }

    _updateComponentTag(component: Component3D, tag: string, prevTag: string) {
        //
        if (prevTag === tag) return;

        if (prevTag) {
            // remove previous tag
            const index = (this._componentsByScriptTag[prevTag] || []).indexOf(
                component
            );

            if (index > -1) {
                this._componentsByScriptTag[prevTag].splice(index, 1);
            }
        }

        if (tag) {
            this._componentsByScriptTag[tag] ??= [];

            this._componentsByScriptTag[tag].push(component);
        }
    }

    /**
     * @internal
     */
    _updateComponentScriptId(
        component: Component3D,
        id: string,
        prevId: string
    ) {
        //
        if (prevId === id) return;

        if (prevId) {
            delete this._componentsByScriptId[prevId];
        }

        if (id) {
            this._componentsByScriptId[id] = component;
        }
    }

    private async _getNode(data: ComponentData) {
        //
        if (this._nodesPromises[data.id] != null) {
            return this._nodesPromises[data.id];
        }

        const promise = this._buildNode(data);

        this._nodesPromises[data.id] = promise;

        return promise;
    }

    /**
     * @internal
     */
    async _resolve(priority: number) {
        const factories = Object.values(this._registry.componentTypes).filter(
            (f) => {
                return f.info.priority === priority;
            }
        );

        await Promise.all(
            factories.map((f) => {
                return f.onResolve();
            })
        );
    }

    /**
     * @deprecated use {@link ComponentManager.byInternalId} instead
     * @internal
     */
    _byDataId(id: string) {
        return this._componentsById[id];
    }

    byInternalId(id: string) {
        return this._componentsById[id];
    }

    get loaded() {
        //
        return this._spaceLoaded.promise;
    }

    /**
     * Returns a component by its id.
     */
    byId(id: string) {
        return this._componentsByScriptId[id];
    }

    /**
     * Returns all component with matching tag.
     * A tag is a string identifier that can be used to group components.
     */
    byTag(tag: string) {
        return this._componentsByScriptTag[tag] || [];
    }

    /**

     * Returns all components with matching type.
     */
    byType(type: string) {
        return this._componentsByType?.[type] || [];
    }

    /**
     * Returns all components with matching name.
     */
    byName(name: string) {
        return this._components.filter((it) => it.data.name === name);
    }

    /**
     * Returns all components satisfying the given filter function.
     */
    filter(f: (c: Component3D) => boolean) {
        return this._components.filter(f);
    }

    /**
     * Returns the first component satisfying the given filter function.
     */
    find(f: (c: Component3D) => boolean) {
        return this._components.find(f);
    }

    /**
     * Iterates over all components and calls the given function for each one.
     */
    forEach(f: (c: Component3D, i) => void) {
        return this._components.forEach((c, i) => f(c, i));
    }

    /**
     * create a new component of the given type.
     * You can pass additional data that will be used to initialize the component.
     *
     * @example
     *
     * ```ts
     *  const component = await Components.create({
     *      type: "model",
     *      url: "https://example.com/model.glb",
     *      position: { x: 0, y: 0, z: 0 }
     *      rotation: { x: 0, y: 0, z: 0 }
     *      scale: { x: 1, y: 1, z: 1 }
     *  })
     * ```
     *
     * For the data format, see the documentation of the component you want to create.
     *
     * @returns
     *
     * a promise that resolves to the created component.
     * The type of the returned component depends on the type of the component you created.
     * For example a "model" component will return a ModelComponent.
     *
     */
    create<T extends CType>(
        data: CreateComponentArg<T>,
        opts: {
            abort?: AbortSignal;
            transient?: boolean;
            parent?: Object3D;
            sessionId?: string;
        } = {}
    ): Promise<ComponentTypeMap[T]> {
        //
        return this._createInternal(data, {
            ...opts,
            persistent: false,
        });
    }

    /**
     * @internal
     */
    async _createInternal<T extends CType>(
        data: CreateComponentArg<T>,
        opts: InternalCreateComponentOpts = {}
    ): Promise<ComponentTypeMap[T]> {
        //
        // try {
        // separate children from the data if present, do not mutate
        let children = Object.values(data.children ?? {});

        data = { ...data };

        delete data.children;

        let factory = await this._registry.getOrCreateFactory(data.type, {
            ...this._opts,
            container: this,
        });

        if (opts?.abort?.aborted) return null;

        if (factory == null) {
            console.log(data.type, factory);

            return null;
        }

        opts = { ...opts };

        if (opts.parent == null) {
            if (data.parentId) {
                //
                opts.parent = this.byInternalId(data.parentId);

                if (opts.parent == null) {
                    throw new Error("Can't find parent " + data.parentId);
                }
            } else {
                //
                opts.parent = this;
            }
        } else {
            //
            if (opts.parent instanceof Component3D) {
                //
                data.parentId = opts.parent.data.id;
            }
        }

        const instance: Component3D = await factory.onAddInstance(data, opts);

        if (opts?.abort?.aborted) {
            factory.onRemoveInstance(instance);

            return null;
        }

        instance[OPTS].persistent = !!opts.persistent;

        instance._computePrefabMap();

        instance.sessionId = opts.sessionId;

        /**
         * We need to flag the children that were created as part
         * of this component creation process (eg scripts), so that
         * we can skip them when duplicating the component.
         * Otherwise, they would be created twice.
         */
        instance.childComponents.forEach((c) => {
            c[OPTS].createdOnInit = true;
        });

        this._components.push(instance);

        this._componentsById[data.id] = instance;

        this._updateComponentScriptId(instance, data.script?.identifier, null);

        this._updateComponentTag(instance, data.script?.tag, null);

        const componentType = data?.type;

        if (componentType) {
            this._componentsByType[componentType] ??= [];

            this._componentsByType[componentType].push(instance);
        }

        instance.userData.opts = opts;

        if (instance.isPersistent) {
            Emitter.emit(Events.COMPONENT_ADDED, instance);
        }

        if (children?.length) {
            const instances = await Promise.all(
                children.map((c) => {
                    return this._createInternal(c as any, {
                        ...opts,
                        parent: instance,
                    });
                })
            );

            instance.emit(instance.EVENTS.CHILDREN_LOADED, instances);
        }

        if (opts.duplicating != true) {
            instance._isLoading = false;
        }

        return instance as any;
        // } catch (err) {
        // console.error("Error creating component ", err, data);

        // return null;
        // }
    }

    /**
     * Removes the given component from the space.
     *
     * @param component
     *
     * The component to remove.
     *
     * @returns
     *
     * true if the component was successfully removed, false otherwise.
     */
    destroy(component: Component3D) {
        component._isLoading = true;
        // if(component.info.required) {

        //     throw new Error("Can't remove required component " + component.data.id)
        // }
        if (component.wasDisposed) return false;

        if (this._componentsById[component.data.id] == null) {
            console.error("Can't find component " + component.data.id);

            return false;
        }

        component.childComponents.forEach((c) => {
            //
            if (c instanceof Component3D) {
                this.destroy(c);
            }
        });

        removeItem(this._components, component);

        delete this._componentsById[component.data.id];

        if (component.data?.script?.identifier) {
            delete this._componentsByScriptId[component.data.script.identifier];
        }

        if (component.data?.script?.tag) {
            const index = (
                this._componentsByScriptTag[component.data.script.tag] || []
            ).indexOf(component);
            if (index > -1) {
                this._componentsByScriptTag[component.data.script.tag].splice(
                    index,
                    1
                );
            }
        }

        if (component.data?.type && typeof component.data.type === "string") {
            const index = (
                this._componentsByType[component.data.type] || []
            ).indexOf(component);
            if (index > -1) {
                this._componentsByType[component.data.type].splice(index, 1);
            }
        }

        const factory =
            this._registry.componentTypes[component.data.type as any];

        factory.onRemoveInstance(component);

        if (component.isPersistent) {
            Emitter.emit(Events.COMPONENT_REMOVED, component);
        }

        component._isLoading = false;

        return true;
    }

    /**
     * Duplicates the given component.
     *
     * @returns
     *
     * a promise that resolves to the duplicated component.
     */
    async duplicate<T extends Component3D>(
        component: T,
        opts?: CreateComponentOpts
    ): Promise<T> {
        //
        const res = await this._duplicateInternal([component], {
            ...opts,
            persistent: false,
        });
        return res[0];
    }

    /**
     * @internal
     */
    async _duplicateInternal<T extends Component3D>(
        components: T[],
        opts: InternalCreateComponentOpts = {}
    ): Promise<T[]> {
        //
        const map = {};
        const instances = await this._duplicateInternalRecursive(
            components,
            opts,
            map
        );
        instances.forEach((c) => c._internalizeRefs(map));
        return instances;
    }

    /**
     * @internal
     */
    async _duplicateInternalRecursive<T extends Component3D>(
        components: T[],
        opts: InternalCreateComponentOpts = {},
        oldToNewIdMap = {}
    ): Promise<T[]> {
        //
        const instances = await Promise.all(
            components.map(async (component) => {
                //
                if (component.info.singleton) {
                    throw new Error(
                        "Can't duplicate singleton component " +
                            component.data.id
                    );
                }

                var data = structuredClone(component._dataWrapper.ownData);

                if (data.script?.identifier) {
                    delete data.script.identifier;
                }

                const uid = nanoid();
                const oldId = data.id;
                data.id = `${data.type}_${uid}`;

                if (opts?.overrideOpts != null)
                    data = { ...data, ...opts.overrideOpts };

                if (opts?.parent) {
                    data.parentId = (opts.parent as any).data?.id;
                }

                delete data["netState"];
                data._netId = opts.netId;

                const instance = (await this._createInternal(data as any, {
                    ...opts,
                    duplicating: true,
                    persistent: opts.persistent,
                })) as any;

                oldToNewIdMap[oldId] = instance.componentId;

                const childs = component.childComponents.filter(
                    (c) => c[OPTS].persistent
                );
                const children = await this._duplicateInternalRecursive(
                    childs,
                    {
                        ...opts,
                        parent: instance,
                    },
                    oldToNewIdMap
                );

                instance.emit(instance.EVENTS.CHILDREN_LOADED, children);

                return instance;
            })
        );

        return instances;
    }

    onSpaceLoaded(cb: () => void) {
        //
        this.once(Events.GAME_SPACE_LOADED, cb);

        return () => {
            this.off(Events.GAME_SPACE_LOADED, cb);
        };
    }

    /**
     * @internal
     */
    _getPlayerAvatar() {
        //
        let mainPlayer: AvatarComponent;

        // @ts-ignore
        mainPlayer = this.byType("spawn")?.[0]?._avatar;

        if (mainPlayer == null) {
            //
            mainPlayer = this.byType("avatar").find(
                (it) => it.data.script?._isPlayer
            ) as any;

            if (mainPlayer) {
                //
                mainPlayer.userData.isCustomAvatar = true;
            }
        }

        return mainPlayer;
    }

    /**
     * @internal
     */
    dispose() {
        if (this.wasDisposed) return;

        this.wasDisposed = true;

        this._components.slice().forEach((c) => {
            this.destroy(c);
        });

        // call ressources dispose

        FontMeshFactory.dispose();

        // =< ===

        this._components = null;

        this._opts = null;

        this._dataDict = null;
    }
}
