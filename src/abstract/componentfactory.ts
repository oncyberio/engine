import type { Space } from "engine/space/wrapper";
import { OPTS, type Component3D } from "./component3D";
import type { ComponentInfo } from "./componentinfo";
import type { ComponentManager } from "engine/space/components";
import type { ComponentMixin } from "./componentmixin";
import { nanoid } from "engine/utils/nanoid";
import { ComponentPhysicsMixin } from "engine/space/mixins/physics";
import { Object3D } from "three";
import { DataSchema, DataSchemaOpts } from "engine/space/datamodel/dataschema";
import { upgradeData } from "engine/utils/js";
import { DataWrapper } from "engine/space/datamodel/datawrapper";

export interface ComponentFactoryOptions {
  space: Space;
  container: ComponentManager;
  data: any;
  externalApi: any;
  disableScripts: boolean;
}

export interface AddOpts {
  abort?: AbortSignal;
  parent?: Object3D;
  persistent?: boolean;
}

export const NB_COMPONENT_PRIORITIES = 10;

export const COMPONENT_PRIORITY = {
  HIGH: 1,
  GROUPS: 2, // we load component groups after high priority
  MEDIUM: 5, // default
  AFTER_KIT: 10, // load after kitbash
  LOW: 20,
};

export class ComponentFactory<T extends Component3D> {
  //
  static info: ComponentInfo = null;

  static dataSchema = new DataSchema();

  static baseDataWrapper = DataWrapper.getBase(this.dataSchema);

  static getTitle(data: any) {
    return data.name || data.type;
  }

  static createDataWrapper(opts: DataSchemaOpts) {
    //
    this.dataSchema = new DataSchema(opts);

    this.baseDataWrapper = DataWrapper.getBase(this.dataSchema);
  }

  // global
  static async onPreload(): Promise<void> {
    return this.preload();
  }

  static async onShutdown() {
    return this.shutdown();
  }

  // Space specific
  constructor() {}

  public opts: ComponentFactoryOptions;

  public space: Space;

  public container: ComponentManager;

  public mixins: Array<ComponentMixin> = [];

  public get info(): ComponentInfo {
    //
    return this.constructor["info"];
  }

  async onInit(opts: ComponentFactoryOptions) {
    //
    this.opts = opts;

    this.space = opts.space;

    this.container = opts.container;

    this.mixins = [new ComponentPhysicsMixin(opts)];

    return this.init(this.opts);
  }

  get dataSchema(): DataSchema {
    //
    return this.constructor["dataSchema"];
  }

  get baseDataWrapper(): DataWrapper {
    //
    return this.constructor["baseDataWrapper"];
  }

  async onResolve() {
    return this.resolve();
  }

  protected wasDisposed = false;

  onDispose() {
    if (this.wasDisposed) {
      return;
    }

    this.wasDisposed = true;

    return this.dispose();
  }

  onValidate(data) {
    return this.validate(data);
  }

  async onAddInstance(data: any, opts: AddOpts): Promise<T> {
    //

    data = this.upgradeData(data);

    data.id = data.id || `${data.type}-${nanoid()}`;

    this.validate(data);

    const instance = await this.addInstance(data, opts);

    await Promise.all(
      this.mixins.map((mixin) => {
        return mixin.init(instance);
      })
    );

    return instance;
  }

  onGetDefInstanceData(data: any) {
    return this.dataSchema.getDefaultData();
  }

  upgradeData(data: any) {
    //
    let defData = this.onGetDefInstanceData(data);

    if (!data.prefabId) {
      //
      data = upgradeData(data, defData);
    }

    return data;
  }

  onRemoveInstance(component: T): void {
    this.mixins.forEach((mixin) => {
      mixin.dispose(component);
    });

    return this.removeInstance(component);
  }

  // Implementation specific

  static validateCreation(config: any): {
    success: boolean;
    message?: string;
  } {
    return { success: true, message: "" };
  }

  static async preload(): Promise<void> {}

  static async shutdown() {}

  protected async init(opts: ComponentFactoryOptions) {}

  protected async resolve() {}

  protected dispose() {}

  protected validate(config: any) {
    // ex: throw new Error("Invalid data")
  }

  async addInstance(data, opts: AddOpts) {
    //
    const instance = await this.createInstance(data);

    instance[OPTS].persistent = !!opts.persistent;

    opts.parent.add(instance);

    return instance;
  }

  removeInstance(component: Component3D) {
    //
    if (component.info.required) {
      //
      console.log("Can't remove required component " + component.data.id);
    }

    component?.parent?.remove(component);

    component._onDispose();
  }

  protected createInstance(data: any): Promise<T> {
    throw "abstract";
  }

  /**
   * @internal
   */
  static _patchMeta() {}

  /**
   * @internal
   */
  async _patch(opts: { instances: T[] }) {}
}
