import { nanoid } from "engine/utils/nanoid";
import { PrefabResourceFactory } from ".";
import { Resource } from "../resource";
import { PrefabResourceData } from "./prefabdata";
import { Component3D } from "engine/abstract/component3D";
import { DataWrapper } from "engine/space/datamodel/datawrapper";
import { IS_EDIT_MODE } from "engine/constants";
import { NetIds } from "engine/space/shared/NetIds";

export interface PrefabResourceOpts {
    data: PrefabResourceData;
    factory: PrefabResourceFactory;
}

export class PrefabResource extends Resource<PrefabResourceData> {
    //
    private _children: PrefabResource[] = [];

    private _parent: PrefabResource | null = null;

    /**
     * @internal
     */
    _dataWrapperInst: DataWrapper;

    constructor(public opts: PrefabResourceOpts) {
        //
        super({
            data: opts.data,
            factory: opts.factory,
        });

        this._state = { type: "loaded" };
    }

    static async create(opts: PrefabResourceOpts) {
        //
        const prefab = new PrefabResource(opts);

        if (opts.data.children) {
            //
            await Promise.all(
                Object.values(opts.data.children).map(async (data) => {
                    //
                    const child =
                        await opts.factory.space.resources.createResource(data);

                    prefab.addChild(child);
                })
            );
        }

        return prefab;
    }

    get _dataWrapper() {
        //

        if (this._dataWrapperInst) {
            //
            return this._dataWrapperInst;
        }

        const base = this.base;

        let baseDataWrapper: DataWrapper;

        if (base == null) {
            //
            const factoryClass = this.space.registry.getFactoryClass(
                this.data.template.type
            );

            if (factoryClass == null) {
                //
                throw new Error(
                    `Factory not found for type: ${this.data.template.type}`
                );
            }

            baseDataWrapper = factoryClass.baseDataWrapper;
            //
        } else {
            //
            baseDataWrapper = base._dataWrapper;
        }

        this._dataWrapperInst = baseDataWrapper.derive(this.data.template, {
            nested: this.parent != null,
        });

        return this._dataWrapperInst;
    }

    removeChild(child: PrefabResource) {
        //
        const idx = this._children.indexOf(child);

        if (idx === -1) {
            //
            throw new Error("Child not found " + child.id);
        }

        child._parent = null;

        child.data.parentId = null;

        delete this.data.children[child.id];

        this._children.splice(idx, 1);

        return child;
    }

    addChild(child: PrefabResource) {
        //
        child._parent = this;

        child.data.parentId = this.id;

        this._children.push(child);

        this.data.children ??= {};

        this.data.children[child.id] = child.data;

        return child;
    }

    get meta() {
        //
        return this.data.meta;
    }

    get isComponent() {
        //
        return true;
    }

    get base() {
        //
        if (!this.data.template.prefabId) return null;

        return this.space.resources.byId(
            this.data.template.prefabId
        ) as PrefabResource;
    }

    get parent() {
        //
        return this._parent;
    }

    get children(): PrefabResource[] {
        //
        return this._children;
    }

    get hasComponentFactory() {
        //
        return false;
    }

    getVariants(): PrefabResource[] {
        //
        return this.space.resources.prefabs.filter((p) =>
            p.extends(this)
        ) as PrefabResource[];
    }

    getDirectVariants(): PrefabResource[] {
        //
        return this.space.resources.prefabs.filter((p) =>
            p.directExtends(this)
        ) as PrefabResource[];
    }

    dependsOn(resource: Resource) {
        //
        return (
            resource.data.id === this.data.template.type ||
            this.extends(resource)
        );
    }

    isDirectTypeOf(data: any) {
        //
        if (!data.prefabId) return false;

        return data.prefabId === this.id;
    }

    isTypeOf(data: any) {
        //
        if (!data.prefabId) return false;

        if (this.isDirectTypeOf(data)) return true;

        const resource = this.space.resources.byId(data.prefabId);

        if (resource == null || !(resource instanceof PrefabResource)) {
            //
            throw new Error(`Invalid prefab id: ${data.prefabId}`);
        }

        return resource.extends(this);
    }

    extends(resource: Resource) {
        //
        let current: Resource = this.base;

        while (current != null) {
            //
            if (current === resource) return true;

            current = current.base;
        }

        return false;
    }

    directExtends(resource: Resource) {
        //
        return this.base === resource;
    }

    hasDependentComponents() {
        //
        if (super.hasDependentComponents()) return true;

        return this.children.some((c) => c.hasDependentComponents());
    }

    dispose() {
        //
    }

    /**
     * @internal
     */
    getDataNode() {
        //
        const children = {};

        const variants = {};

        const instances = {};

        this.children.forEach((c) => {
            //
            children[c.id] = c.getDataNode();
        });

        this.getDirectVariants().forEach((v) => {
            //
            variants[v.id] = v.getDataNode();
        });

        this.getDirectInstances().forEach((i) => {
            //
            instances[i.id] = i.getDataNode();
        });

        return {
            ...structuredClone(this.data),
            children,
            variants,
            instances,
        };
    }

    /**
     * @internal
     */
    static getInstanceData(
        prefabData: PrefabResourceData,
        opts?: { netId?: string }
    ) {
        //
        const uid = nanoid();

        const data: any = {
            id: prefabData.template.type + "-" + nanoid(),
            prefabId: prefabData.id,
            type: prefabData.template.type,
            name: prefabData.name,
        };

        if (!IS_EDIT_MODE) {
            //
            data._netBase = prefabData.id;
            data._netId = opts?.netId ?? NetIds.nextId(prefabData.id);
        }

        const prefabChildren = Object.values(prefabData.children || {});

        if (prefabChildren.length) {
            //
            data.children = {};

            prefabChildren.forEach((child) => {
                //
                data.children[child.id] = PrefabResource.getInstanceData(
                    child,
                    opts
                );
            });
        }

        return data;
    }

    instantiate(opts: {
        parent?: Component3D;
        abort?: AbortSignal;
        netId?: string;
    }) {
        //
        const instanceData = PrefabResource.getInstanceData(this.data, opts);

        return this.space.components.create(instanceData, opts);
    }

    /**
     * @internal
     */
    _instantiateInternal(opts: {
        parent?: Component3D;
        abort?: AbortSignal;
        persistent?: boolean;
    }) {
        //
        const instanceData = PrefabResource.getInstanceData(this.data);

        return this.space.components._createInternal(instanceData, opts);
    }

    //#region Instance Management
    private _safeCheckDataWrappers(instance) {
        //
        // safety check
        if (instance._dataWrapper.base != this._dataWrapper) {
            //
            throw new Error(
                "Instance data wrapper mismatch! this is a bug! Please report this issue!"
            );
        }
    }
    private assertNotInstance(instance: Component3D) {
        //
        if (instance.prefab == this) {
            //
            this._safeCheckDataWrappers(instance);

            throw new Error("Instance is already attached to this prefab");
        }
    }

    private assertInstance(instance: Component3D) {
        //
        if (instance.prefab != this) {
            //
            throw new Error("Instance is not attached to this prefab");
        }

        this._safeCheckDataWrappers(instance);
    }

    private assertSameType(instance: Component3D) {
        //
        if (this.data.template.type !== instance.data.type) {
            //
            throw new Error("Type mismatch");
        }
    }

    attachInstance(instance: Component3D) {
        this._attachInstance(instance);

        instance._computePrefabMap();

        let root = instance;
        while (root.parent && (root.parent as Component3D).data?.prefabId)
            root = root.parent as Component3D;

        root._internalizeRefs();
    }

    _attachInstance(instance: Component3D) {
        //
        this.assertNotInstance(instance);

        this.assertSameType(instance);

        this._attachInstanceProps(instance);

        const children = instance.childComponents.filter((c) => c.isPersistent);

        const prefabChildren = this.children;

        if (children.length !== prefabChildren.length) {
            //
            throw new Error("Prefab children count mismatch");
        }

        for (let i = 0; i < prefabChildren.length; i++) {
            //
            const childPrefab = prefabChildren[i];

            const childInstance = children[childPrefab.data._index ?? i];

            if (childPrefab == null) {
                //
                throw new Error("Child prefab not found " + childPrefab.id);
            }

            childPrefab.attachInstance(childInstance);
        }
    }

    private _attachInstanceProps(instance: Component3D) {
        //
        instance._dataWrapper.rebase(this._dataWrapper);
        instance._dataWrapper.set("prefabId", this.id);

        if (!instance.data.name && this.data.name) {
            instance._dataWrapper.set("name", this.data.name);
        }
    }

    detachInstance(instance: Component3D) {
        //
        const idToPrefabId = {};

        let root = instance;
        while (root.parent && (root.parent as Component3D).data?.prefabId)
            root = root.parent as Component3D;

        this._detachInstance(instance, idToPrefabId);

        // internalizing with a reverse map = externalizing
        root._internalizeRefs(idToPrefabId);
    }

    _detachInstance(instance: Component3D, idToPrefabId: any = {}) {
        //
        this.assertInstance(instance);

        idToPrefabId[instance.data.prefabId] = instance.componentId;

        this._detachInstanceProps(instance);

        const children = instance.childComponents.filter((c) => c.isPersistent);

        const prefabChildren = this.children;

        if (children.length !== prefabChildren.length) {
            //
            throw new Error("Prefab children count mismatch");
        }

        for (let i = 0; i < children.length; i++) {
            //
            const childInstance = children[i];

            const childPrefab = prefabChildren.find(
                (it) => it.data.id === childInstance.data.prefabId
            );

            if (childPrefab == null) {
                //
                throw new Error("Child prefab not found " + childPrefab.id);
            }

            childPrefab._detachInstance(childInstance, idToPrefabId);
        }
    }

    private _detachInstanceProps(instance: Component3D) {
        //
        this.assertInstance(instance);

        instance._dataWrapper.detach();

        if (this.base) {
            //
            instance._dataWrapper.set("prefabId", this.base.id);
        } else {
            //
            instance._dataWrapper.unset("prefabId");
        }
    }

    isChildAddOverride(instance: Component3D) {
        //
        this.assertInstance(instance);

        // not a nested prefab
        if (!this.parent) return false;

        return instance.parentComponent?.prefab != this.parent;
    }
    //#endregion
}
