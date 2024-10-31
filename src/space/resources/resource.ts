import type { Space } from "engine/space/wrapper";
import type { ResourceFactory } from "./resourcefactory";
import type { PrefabResource } from "./prefabs/prefabresource";
import type { ScriptResource } from "./scripts/scriptresource";

//
export interface ResourceData<T = unknown> {
    //
    type: T; // script, model, image, audio, video, etc

    id: string;

    name?: string;

    image?: string;

    kit?: string;
}

interface ResourceOpt<Data extends ResourceData = ResourceData> {
    data: Data;
    factory: ResourceFactory<any>;
}

interface ResourceState {
    type: "idle" | "loaded" | "error";
}

export class Resource<Data extends ResourceData = ResourceData> {
    //
    protected _data: Data;

    readonly space: Space;

    _resourceFactory: ResourceFactory<any>;

    protected _state: ResourceState = {
        type: "idle",
    };

    constructor(opts: ResourceOpt<Data>) {
        //
        this._data = opts.data;

        this._resourceFactory = opts.factory;

        this.space = opts.factory.space;
    }

    isPrefab(): this is PrefabResource {
        //
        return this._data.type === "prefab";
    }

    isScript(): this is ScriptResource {
        //
        return this._data.type === "script";
    }

    get id() {
        //
        return this._data.id;
    }

    get data() {
        //
        return this._data;
    }

    get isComponent() {
        //
        return false;
    }

    get base() {
        //
        return null;
    }

    get parent() {
        //
        return null;
    }

    get hasComponentFactory() {
        //
        return false;
    }

    get state() {
        //
        return this._state;
    }

    private _wasDisposed = false;

    onDispose() {
        //
        if (this._wasDisposed) {
            return;
        }

        this._wasDisposed = true;

        this.dispose();
    }

    dependsOn(resource: Resource) {
        //
        return false;
    }

    getDependentResources() {
        //
        return this.space.resources.filter((r) => r.dependsOn(this));
    }

    getRequiredResources() {
        //
        return this.space.resources.filter(
            (r) => r != this && this.dependsOn(r)
        );
    }

    hasDependentResources() {
        //
        const it = this.space.resources.find((r) => r.dependsOn(this));

        return it != null;
    }

    hasDependentComponents() {
        //
        const it = this.space.components.find((c) =>
            this.isRefByComponent(c.data)
        );

        return it != null;
    }

    getInstances() {
        //
        return this.space.components.filter((c) => this.isTypeOf(c.data));
    }

    getDirectInstances() {
        //
        return this.space.components.filter((c) => this.isDirectTypeOf(c.data));
    }

    hasReferences() {
        //
        return this.hasDependentResources() || this.hasDependentComponents();
    }

    isRefByResource(r: Resource) {
        //
        return r.dependsOn(this);
    }

    isDirectTypeOf(data: any) {
        //
        if (!this.hasComponentFactory) return false;

        return this._data.id === data.type;
    }

    isTypeOf(data: any) {
        //
        return this.isDirectTypeOf(data);
    }

    isRefByComponent(data: any) {
        //
        return this.isTypeOf(data);
    }

    destroy() {
        //
        return this.space.resources.destroyResource(this);
    }

    dispose() {}
}
