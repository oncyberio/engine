import { FactoryClass } from "../registry";
import { Space } from "../wrapper";
import { Resource, ResourceData } from "./resource";
import { ResourceFactoryOpts } from "./types";
import { reconcileData } from "../shared/reconciledata";
import { ScriptResource } from "./scripts/scriptresource";

export interface CreateOpts {
    isLoading?: boolean;
}

//
export class ResourceFactory<R extends Resource> {
    //
    readonly space: Space;

    readonly hasComponentFactory: boolean = false;

    constructor(protected opts: ResourceFactoryOpts) {
        this.space = opts.space;
    }

    async onInit() {
        return this.init();
    }

    onDispose() {
        return this.dispose();
    }

    async onResolve(resources: R[]) {
        //
        await this.resolve(resources);

        await Promise.all(
            //
            resources.map((resource) => {
                //
                return this._updateComponentFactory(resource);
            })
        );
    }

    private async _updateComponentFactory(resource: Resource) {
        //
        let factoryClass = this.opts.space.registry.getFactoryClass(
            resource.id
        );

        const hadFactory = factoryClass != null;

        const hasFactory = resource.hasComponentFactory;

        if (!hasFactory && hadFactory) {
            //
            throw new Error("No longer a component " + resource.id);
        }

        if (hasFactory && !hadFactory) {
            //
            this._registerComponent(resource);
        }

        if (hadFactory) {
            //
            factoryClass._patchMeta();

            let instances = resource.getInstances();

            if (resource.data.type === "script") {
                //
                let module = resource as ScriptResource;

                let prefabs = module.getPrefabs();

                prefabs.forEach((prefab) => {
                    //
                    const newData = reconcileData({
                        data: structuredClone(prefab.data.template),
                        newData: module.getDefaultComponentData(),
                        prevParams: module._prevParams,
                        nextParams: module._params,
                        isDerived: prefab.data.template.prefabId != null,
                    });

                    prefab.data.template = newData;

                    prefab._dataWrapperInst?.setOwnData(newData, false);
                });
            }

            const factory = this.opts.space.registry.getExistingFactory(
                resource.data.id
            );

            if (factory) {
                //
                await factory._patch({ instances });
            }
        }
    }

    private _registerComponent(resource: Resource<any>) {
        //
        const cfact = this.getComponentFactory(resource as any);

        this.opts.space.registry.addFactory(resource.data.id, cfact);
    }

    // Virtual methods

    async init() {}

    dispose() {}

    async resolve(resources: R[]) {}

    getComponentFactory(proto: R): FactoryClass {
        //
        throw new Error("To be implemented");
    }

    async onCreateResource(data: ResourceData) {
        //
        return this.createResource(data);
    }

    async createResource(data: ResourceData): Promise<R> {
        //
        throw new Error("To be implemented");
    }

    async onUpdateResource(resource: R, data: R["data"]) {
        //
        await this.updateResource(resource, data);
    }

    async updateResource(resource: R, data: R["data"]): Promise<R> {
        //
        throw new Error("To be implemented");
    }

    onDestroyResource(resource: R) {
        //
        if (resource.hasReferences()) {
            //
            throw new Error(
                "Can't destroy a resource with references " + resource.data.id
            );
        }

        if (resource.hasComponentFactory) {
            //
            this.opts.space.registry.deleteFactory(resource.id);
        }

        this.destroyResource(resource);
    }

    destroyResource(resource: R) {
        //
        throw new Error("To be implemented");
    }
}
