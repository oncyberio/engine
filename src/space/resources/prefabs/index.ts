import { CreateOpts, ResourceFactory } from "../resourcefactory";
import { PrefabResourceData } from "./prefabdata";
import { PrefabResource } from "./prefabresource";

export class PrefabResourceFactory extends ResourceFactory<PrefabResource> {
    //
    private _byId: Record<string, PrefabResource> = {};

    private _byName: Record<string, PrefabResource> = {};

    async init() {}

    async resolve(resources: PrefabResource[]) {}

    // getComponentFactory(proto: PrefabResource) {
    //     //
    //     return createPrefabFactory(proto);
    // }

    async createResource(data: PrefabResourceData): Promise<PrefabResource> {
        //
        let parent;

        if (data.parentId) {
            //
            parent = this._byId[data.parentId];
        }

        const proto = await PrefabResource.create({
            data,
            factory: this,
        });

        if (parent) {
            //
            parent.addChild(proto);
        }

        this._byId[data.id] = proto;

        this._byName[data.name] = proto;

        return proto;
    }

    async updateResource(
        prefab: PrefabResource,
        data: PrefabResourceData
    ): Promise<PrefabResource> {
        //
        // prefab._patch({ data });

        return prefab;
    }

    destroyResource(prefab: PrefabResource): void {
        //
        // delete children
        prefab.children.forEach((child) => {
            //
            this.destroyResource(child);
        });

        delete this._byId[prefab.data.id];

        delete this._byName[prefab.data.name];

        prefab.onDispose();
    }

    getPrefabByName(uri: string) {
        //
        return this._byName[uri];
    }

    getPrefabById(id: string) {
        //
        return this._byId[id];
    }

    find(fn: (module: PrefabResource) => boolean) {
        //
        return Object.values(this._byId).find(fn);
    }

    filter(fn: (module: PrefabResource) => boolean) {
        //
        return Object.values(this._byId).filter(fn);
    }

    canDestroy(resource: PrefabResource) {
        // TODO: checks deps
        return true;
    }
}
