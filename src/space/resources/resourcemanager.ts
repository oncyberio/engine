import { Component3D } from "engine/abstract/component3D";
import { PrefabResource } from "./prefabs/prefabresource";
import { factoryTypeMap, ResourceByType } from "./map";
import { PrefabResourceData } from "./prefabs/prefabdata";
import { Resource, ResourceData } from "./resource";
import { CreateOpts, ResourceFactory } from "./resourcefactory";
import { ScriptResourceFactory } from "./scripts";
import { ScriptResource } from "./scripts/scriptresource";
import { ResourceFactoryOpts } from "./types";
import { nanoid } from "engine/utils/nanoid";
import { update } from "three/examples/jsm/libs/tween.module.js";

type ResourceManagerOpts = ResourceFactoryOpts;

export class ResourceManager {
  //
  resourcesById: Record<string, Resource> = {};

  resourcesbyType: Record<string, Resource[]> = {};

  _factoryPromises: Record<string, Promise<ResourceFactory<any>>> = {};

  _factories: Record<string, ResourceFactory<any>> = {};

  constructor(private opts: ResourceManagerOpts) {
    //
    globalThis["$resources"] = this;
  }

  private async _createFactory(type: string) {
    //
    const constructor = factoryTypeMap[type];

    if (!constructor) {
      throw new Error("No factory found for type " + type);
    }

    const factory = new constructor(this.opts);

    await factory.onInit();

    this._factories[type] = factory;

    return factory;
  }

  private async _getFactory(type: string) {
    //
    let promise = this._factoryPromises[type];

    if (promise == null) {
      promise = this._factoryPromises[type] = this._createFactory(type);
    }

    return promise;
  }

  async _loadAll() {
    //
    this._getFactory("script");
    return this.loadResources(Object.values(this.opts.data));
  }

  async loadResources(datas: ResourceData<any>[]) {
    //
    let resByType = {} as Record<string, Resource[]>;

    let result = {
      created: [] as Resource[],
      updated: [] as Resource[],
    };

    await Promise.all(
      datas.map(async (data) => {
        //
        let resource = this.byId(data.id);

        if (resource == null) {
          //
          resource = await this.createResource(data, {
            isLoading: true,
          });

          result.created.push(resource);
          //
        } else {
          //
          await this.updateResource(resource, data, {
            isLoading: true,
          });

          result.updated.push(resource);
        }

        resByType[data.type] ??= [];

        resByType[data.type].push(resource);
      })
    );

    await Promise.all(
      //
      Object.entries(resByType).map(([type, resources]) => {
        //
        const factory = this._factories[type];

        return factory.onResolve(resources);
      })
    );

    return result;
  }

  async createResource<T extends keyof ResourceByType>(
    data: ResourceData<T>,
    opts: CreateOpts = {}
  ): Promise<ResourceByType[T]> {
    //
    let factory = await this._getFactory(data.type);

    const resource = await factory.createResource(data);

    this.setResource(resource);

    if (!opts?.isLoading) {
      //
      await factory.onResolve([resource]);
    }

    return resource;
  }

  destroyResource(resource: Resource) {
    //
    const factory = this._factories[(resource.data as any).type];

    if (factory == null) {
      throw new Error("Factory not found for resource " + resource.data.type);
    }

    const instances = factory.onDestroyResource(resource as any);

    this.removeResource(resource);

    return instances;
  }

  async updateResource<T extends Resource>(
    resource: T,
    data: T["data"],
    opts: CreateOpts = {}
  ) {
    //
    let factory = resource._resourceFactory;

    await factory.onUpdateResource(resource, data);

    if (!opts.isLoading) {
      //
      await factory.onResolve([resource]);
    }
  }

  private setResource(resource: Resource) {
    //
    const data = resource.data as any;

    this.resourcesById[data.id] = resource;

    this.resourcesbyType[data.type] ??= [];

    const idx = this.resourcesbyType[data.type].findIndex(
      (it) => it.data.id === data.id
    );

    if (idx === -1) {
      this.resourcesbyType[data.type].push(resource);
    } else {
      this.resourcesbyType[data.type][idx] = resource;
    }
  }

  private removeResource(resource: Resource) {
    //
    const data = resource.data as any;

    delete this.resourcesById[data.id];

    this.resourcesbyType[data.type] = this.resourcesbyType[data.type].filter(
      (r) => r !== resource
    );
  }

  byId(id: string) {
    //
    return this.resourcesById[id] as Resource<ResourceData<any>>;
  }

  find(fn: (resource: Resource) => boolean) {
    //
    return Object.values(this.resourcesById).find(fn);
  }

  filter(fn: (resource: Resource) => boolean) {
    //
    return Object.values(this.resourcesById).filter(fn);
  }

  forEach(fn: (resource: Resource) => void) {
    //
    Object.values(this.resourcesById).forEach(fn);
  }

  getPrefab(id: string) {
    //
    const resource = this.resourcesById[id];

    if (resource == null) return null;

    if (!resource.isPrefab()) {
      throw new Error("Resource is not a prefab " + id);
    }

    return resource;
  }

  getScript(id: string) {
    //
    const resource = this.resourcesById[id];

    if (resource == null) return null;

    if (!resource.isScript()) {
      throw new Error("Resource is not a script " + id);
    }

    return resource;
  }

  get factories() {
    //
    return this._factories;
  }

  get scriptFactory() {
    //
    return this._factories.script as ScriptResourceFactory;
  }

  //#region Scripts
  get scripts() {
    //
    return this.resourcesbyType.script as ScriptResource[];
  }

  get scriptsByUri() {
    //
    return this.scripts.reduce((acc, script) => {
      acc[script.data.uri] = script;

      return acc;
    }, {} as Record<string, ScriptResource>);
  }
  //#endregion

  //#region Prefabs
  createPrefab(data: PrefabResourceData) {
    //
    return this.createResource(data);
  }

  private _getPrefabDataSingle(
    instance: Component3D,
    meta: any,
    opts?: { parentId: string }
  ): PrefabResourceData {
    //
    const template = instance._dataWrapper.getTemplateData({
      nested: !!opts?.parentId,
    });

    const prefabData: PrefabResourceData = {
      id: "prefab-" + nanoid(),
      type: "prefab",
      parentId: opts?.parentId ?? null,
      name: meta.name ?? "",
      meta,
      template,
      children: {},
    };

    return prefabData;
  }

  getPrefabDataFromInstance(
    instance: Component3D,
    meta: any,
    opts?: { parentId: string },
    idToPrefabId: any = {}
  ): PrefabResourceData {
    //
    const prefabData: any = this._getPrefabDataSingle(instance, meta, opts);

    const children = instance.childComponents.filter((c) => c.isPersistent);

    idToPrefabId[instance.componentId] = prefabData.id;

    for (let i = 0; i < children.length; i++) {
      //
      const child = children[i];

      const childData = this.getPrefabDataFromInstance(
        child,
        {
          name: child.data.name ?? child.data.type,
          image: child.info.image,
        },
        {
          parentId: prefabData.id,
        }
      );

      childData._index = i;

      prefabData.children[childData.id] = childData;

      idToPrefabId[child.componentId] = childData.id;
    }

    return prefabData;
  }

  _getDefChildMeta(instance: Component3D) {
    //
    return {
      name: instance.data.name ?? instance.data.type,
      image: instance.info.image,
    };
  }

  getPrefabData(instance: Component3D, options: any) {
    if (options.type === "Top") {
      //
      const map = {};
      const data = this.getPrefabDataFromInstance(
        instance,
        options.meta,
        null,
        map
      );
      this.internalizeRefs(data, map);
      return data;
      //
    } else {
      //
      return this.getChildOverrideAddData(instance, options.parentId);
    }
  }

  getChildOverrideAddData(instance: Component3D, parentId: string) {
    //
    const prefabData = this.getPrefabDataFromInstance(
      instance,
      this._getDefChildMeta(instance),
      {
        parentId,
      }
    );

    const parent = instance.parentComponent.prefab;

    const match = this.byId(parentId) as PrefabResource;

    if (match !== parent) {
      //
      throw new Error("Parent id mismatch");
    }

    /**
     * When committing a child to a parent prefab, we need to:
     *
     * - instantiate the child in all instances of the parent prefab
     * - create a new child variant in all variants of the parent prefab
     */

    prefabData["instances"] = this.getInstancesData(
      prefabData,
      parent,
      instance.parentComponent
    );

    prefabData["variants"] = this.getVariantsData(prefabData, parent);

    return prefabData;
  }

  getInstancesData(
    prefabData: PrefabResourceData,
    parent: PrefabResource,
    except?: Component3D
  ) {
    //
    const instancesData = {};

    const parentInstances = parent.getDirectInstances();

    for (let parent of parentInstances) {
      //
      if (parent === except) continue;

      const instanceData = PrefabResource.getInstanceData(prefabData);

      instanceData.parentId = parent.data.id;

      instancesData[instanceData.id] = instanceData;
    }

    return instancesData;
  }

  getVariantsData(prefabData: PrefabResourceData, parent: PrefabResource) {
    //
    const variantsData = {};

    const parentVariants = parent.getDirectVariants();

    for (let parent of parentVariants) {
      //
      const variantData = this.getVariantData(prefabData, parent);

      variantsData[variantData.id] = variantData;
    }

    return variantsData;
  }

  getVariantData(prefabData: PrefabResourceData, parent: PrefabResource) {
    //
    const variantData: PrefabResourceData = {
      id: "prefab-" + nanoid(),
      type: "prefab",
      parentId: parent.id,
      name: prefabData.name,
      meta: { ...prefabData.meta },
      template: {
        type: prefabData.template.type,
        prefabId: prefabData.id,
      },
      children: {},
    };

    variantData["instances"] = this.getInstancesData(prefabData, parent);

    variantData["variants"] = this.getVariantsData(prefabData, parent);

    return variantData;
  }

  async createFromInstance(
    instance: Component3D,
    meta: PrefabResourceData["meta"]
  ) {
    //
    const prefabData = this.getPrefabDataFromInstance(instance, meta);

    const prefab = await this.createPrefab(prefabData);

    prefab.attachInstance(instance);

    return prefab;
  }

  get prefabs() {
    //
    return (this.resourcesbyType.prefab ?? []) as PrefabResource[];
  }

  internalizeRefs(prefabData: PrefabResourceData, map: any) {
    if (!prefabData) return;
    this.internalizeTemplateRefs(prefabData.template, map);
    Object.values(prefabData.children || {}).forEach((p) =>
      this.internalizeRefs(p, map)
    );
  }

  internalizeTemplateRefs(template: any, map: any) {
    Object.entries(template || {}).forEach(([k, v]: any) => {
      if (typeof v !== "object") return;
      if (v?.$$id && map[v.$$id]) {
        v.$$id = map[v.$$id];
      } else {
        this.internalizeTemplateRefs(v, map);
      }
    });
  }

  //#endregion

  dispose() {
    //
    for (let key in this.resourcesById) {
      //
      let resource = this.resourcesById[key];

      resource.dispose();
    }

    this.resourcesById = {};

    this.resourcesbyType = {};

    for (let key in this._factories) {
      //
      let factory = this._factories[key];

      factory.dispose();
    }
  }
}
