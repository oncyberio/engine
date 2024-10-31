import { Component3D } from "engine/abstract/component3D";
import {
  AbstractParam,
  ArrayParam,
  ComponentParam,
  GroupParam,
  MapParam,
  ReceiverParam,
  ScriptParam,
  SignalParam,
  Tagged,
  TriggerParam,
  UnionParam,
  Vec2Param,
  Vec3Param,
} from "./decorators";
import { Vector2, Vector3 } from "three";
import { ArrayParamImpl } from "./ArrayWrapperImpl";
import { IS_EDIT_MODE } from "engine/constants";
import { newIncId } from "engine/utils/js";
import { Action, SignalEmitter } from "./signals";

export type Key = string | number;

const WRAP_KEY = Symbol("@@wrapkey");

export interface DescCtx {
  host: Component3D;
  path: Key[];
  key: Key;
}

export interface PropCtx<I, D, P extends ScriptParam> {
  param: P;
  transient?: boolean;
}

export interface Descriptor {
  get: () => any;
  set?: (value: any) => void;
  dispose?: () => void;
}

export type EntityState =
  | number
  | string
  | boolean
  | { type: "map"; schema: EntityState }
  | { type: "object"; schema: Record<string, EntityState> }
  | { type: "array"; schema: EntityState };

export abstract class ScriptProp<
  I = any,
  D = any,
  P extends ScriptParam = AbstractParam
> {
  //
  param: P;
  transient = false;

  constructor(public ctx: PropCtx<I, D, P>) {
    //
    this.param = ctx.param;
    this.transient = ctx.transient ?? false;
  }

  getDefaultData(): D {
    return this.serialize(this.getDefault());
  }

  abstract getDefault(): I;

  abstract validate(instance: any): boolean;

  abstract serialize(value: I): D;

  getSchema() {
    return undefined;
  }

  onInstanceInit(ctx: DescCtx) {}

  abstract createDescriptor(ctx: DescCtx): Descriptor;

  getDataVal(ctx: DescCtx): D {
    //
    if (IS_EDIT_MODE) {
      //
      return ctx.host._dataWrapper.get(ctx.path as any);
    }

    return ctx.host._dataWrapper.getMerged(ctx.path as any);
  }

  setDataVal(ctx: DescCtx, fnOrVal: D | ((data: D) => D)) {
    //
    const isFn = typeof fnOrVal === "function";

    let oldValue = isFn ? this.getDataVal(ctx) : null;

    const value = isFn ? (fnOrVal as any)(oldValue) : fnOrVal;

    ctx.host._dataWrapper.setMerged(ctx.path as any, value);
  }

  onGetGui(ctx: DescCtx) {
    //
    let gui = this.getGui(ctx);

    const folder = this.param.useFolder;

    if (folder) {
      //
      gui = {
        type: "folder",
        label: folder.label ?? ctx.key,
        children: {
          [ctx.key]: gui,
        },
      };
    }

    return gui;
  }

  getGui(ctx: DescCtx): any {
    //
    const param = this.param;

    return {
      ...param,
      label: (param as any).label || param.name,
      value: [ctx.host._dataWrapper._proxy, ...ctx.path],
    };
  }

  protected wrapValueObj(ctx: DescCtx, obj: any, keys: string[]) {
    if (obj[WRAP_KEY]) return;

    Object.defineProperty(obj, WRAP_KEY, {
      value: true,
      writable: false,
    });

    keys.forEach((key) => {
      //
      Object.defineProperty(obj, key, {
        get: () => {
          return this.getDataVal(ctx)?.[key];
        },
        set: (value) => {
          this.setDataVal(ctx, (data) => ({
            ...data,
            [key]: value,
          }));
        },
      });
    });
  }

  getVal(instance: any, path: Key[]) {
    //
    let value = instance;

    for (let i = 0; i < path.length; i++) {
      //
      const key = path[i];

      value = value[key];

      if (value == null) return null;
    }

    return value;
  }

  static create(ctx: PropCtx<any, any, any>): ScriptProp<any, any, any> {
    //
    if (ctx.param.bindable) {
      //
      return new BoundProp(ctx);
    }

    let paramType = ctx.param.type as ScriptParam["type"];

    if (paramType === "string" || paramType === "text") {
      return new StringProp(ctx);
    }

    if (paramType === "number") {
      return new NumberProp(ctx);
    }

    if (paramType === "boolean" || paramType === "checkbox") {
      return new BooleanProp(ctx);
    }

    if (paramType === "color") {
      return new ColorProp(ctx);
    }

    if (paramType === "select") {
      return new SelectProp(ctx);
    }

    if (paramType === "vec2") {
      return new Vector2Prop(ctx);
    }

    if (paramType === "vec3" || paramType === "xyz") {
      return new Vector3Prop(ctx);
    }

    if (paramType === "group") {
      return new ObjectProp(ctx);
    }

    if (paramType === "component") {
      return new ComponentProp(ctx);
    }

    if (paramType === "button") {
      return new ButtonProp(ctx);
    }

    if (paramType === "resource") {
      return new ResourceProp(ctx);
    }

    if (paramType === "signal") {
      return new SignalProp(ctx);
    }

    if (paramType === "receiver") {
      return new ActionProp(ctx);
    }

    if (paramType === "array") {
      return new ArrayProp(ctx);
    }

    if (paramType === "union") {
      return new UnionProp(ctx);
    }

    if (paramType === "map") {
      return new MapProp(ctx);
    }

    throw new Error(`Unknown param type: ${paramType}`);
  }
}

export abstract class SimpleProp<I> extends ScriptProp<I, I, any> {
  //
  serialize(value: I) {
    return value;
  }

  createDescriptor(ctx: DescCtx) {
    //
    return {
      get: () => {
        //
        return this.getDataVal(ctx);
      },
      set: (value: I) => {
        //
        this.setDataVal(ctx, value);
      },
    };
  }

  getSchema() {
    return this.getDefault();
  }
}

export class StringProp extends SimpleProp<string> {
  //
  getDefault() {
    return this.param.defaultValue ?? "";
  }

  validate(instance: any) {
    return typeof instance === "string";
  }
}

export class NumberProp extends SimpleProp<number> {
  //
  getDefault() {
    return this.param.defaultValue ?? this.param.min ?? 0;
  }

  validate(instance: any) {
    return typeof instance === "number";
  }
}

export class BooleanProp extends SimpleProp<boolean> {
  //
  getDefault() {
    return this.param.defaultValue ?? false;
  }

  validate(instance: any) {
    return typeof instance === "boolean";
  }
}

export class ColorProp extends SimpleProp<string> {
  //
  regex = /^#[0-9a-f]{6}$/i;

  getDefault() {
    return this.param.defaultValue ?? "#000000";
  }

  validate(instance: any) {
    return typeof instance === "string" && this.regex.test(instance);
  }
}

export class SelectProp extends SimpleProp<string> {
  //
  getDefault() {
    let def = this.param.defaultValue;
    if (!def) {
      const fstOption = this.param.options[0];
      def = fstOption?.id ?? fstOption ?? null;
    }
    return def;
  }

  validate(instance: any) {
    // check if the value is in the options
    return this.param.options.some(
      (it) => it?.id === instance || it === instance
    );
  }
}

export interface ResourcePropData {
  $$id: string;
  $$paramType: "resource";
}

export class ResourceProp extends SimpleProp<ResourcePropData> {
  //
  getDefault() {
    return {
      $$id: null,
      $$paramType: "resource" as const,
    };
  }

  getSchema() {
    return undefined;
  }

  validate(instance: any) {
    return instance?.$$paramType === "resource";
  }

  getGui(ctx: DescCtx) {
    //
    const gui = super.getGui(ctx);

    gui.info ??= `Upload, or drag & drop here a resource from the assets panel`;

    return gui;
  }
}

export class ButtonProp extends ScriptProp<any, any, TriggerParam> {
  //
  getDefault() {
    return undefined;
  }

  validate(instance: any) {
    return false;
  }

  serialize() {
    return null;
  }

  createDescriptor(ctx: DescCtx) {
    //
    if (this.param.action) {
      //
      return {
        get: () => this.param.action,
      };
    }

    return null;
  }

  getGui(ctx: DescCtx): any {
    //
    const gui = super.getGui(ctx);

    const instance = ctx.host;
    const param = this.param;

    gui.value = null;

    gui.label = param.label ?? ctx.key;

    let action = param.action;

    if (action == null) {
      //
      let path = ctx.path as string[];

      if (path[path.length - 1] != param.methodKey) {
        //
        path = path.slice();

        path[path.length - 1] = param.methodKey;
      }

      action = this.getVal(instance, path);
    }

    gui.onAction = () => {
      //
      action?.call(instance);
    };

    return gui;
  }
}

interface ReceiverConnection {
  $$id: string;
  $$event: string;
}

// interface ReceiverHandlerCtx {
//     instance: Component3D;
//     data: any;
// }

export class ActionProp extends ScriptProp<any, any, ReceiverParam> {
  //

  _getCallback(descCtx: DescCtx) {
    //
    let callback = this.param.callback;

    if (callback == null) {
      //
      let path = descCtx.path as string[];

      if (path[path.length - 1] != this.param.methodKey) {
        //
        path = path.slice();

        path[path.length - 1] = this.param.methodKey;
      }

      const method = this.getVal(descCtx.host, path);

      callback = (...args: any[]) => {
        //
        method?.call(descCtx.host, ...args);
      };
    }

    return callback;
  }

  getDefault() {
    return undefined;
  }

  validate(instance: any) {
    return false;
  }

  serialize() {
    return null;
  }

  createDescriptor(ctx: DescCtx) {
    //
    const callback = this._getCallback(ctx);

    const action = new Action(callback);

    let dispose = null;

    ctx.host.once(ctx.host.EVENTS.READY, () => {
      //
      dispose = this.initConnection(ctx, action);
    });

    return {
      get: () => action,
      dispose,
    };
  }

  private _getSignal(ctx: DescCtx, data: ReceiverConnection) {
    //
    const source = ctx.host._getRef(data.$$id);

    if (source == null) return null;

    const signal = this.getVal(source, data.$$event.split("."));

    if (!(signal instanceof SignalEmitter)) {
      //
      const prefix = signal != null ? "Invalid" : "Undefined";

      console.error(`${prefix} signal emitter at`, data.$$event, signal);

      return null;
    }

    return signal;
  }

  initConnection(ctx: DescCtx, action: Action<any>) {
    //
    let curData = this.getDataVal(ctx);

    let disposeData = ctx.host._dataWrapper.onChange(() => {
      //
      const newData = this.getDataVal(ctx);

      if (newData == curData) return;

      sync(newData);

      curData = newData;
    });

    let cache = {} as Record<string, ReceiverConnection>;

    const sync = (newData: ReceiverConnection[]) => {
      //
      const oldCache = cache;
      cache = {};

      newData?.forEach((data) => {
        //
        const key = data.$$id + data.$$event;

        if (!oldCache[key]) {
          //
          const signal = this._getSignal(ctx, data);

          if (signal == null) return;

          action.connectTo(signal);

          cache[key] = data;
        }

        cache[key] = data;
      });

      Object.keys(oldCache).forEach((key) => {
        //
        if (!cache[key]) {
          //
          const data = oldCache[key];

          const signal = this._getSignal(ctx, data);

          if (signal == null) return;

          action.disconnectFrom(signal);
        }
      });
    };

    sync(curData);

    return () => {
      //
      disposeData();

      action.dispose();
    };
  }
}

export class PresetsProp extends ScriptProp<any, any, any> {
  //
  getDefault() {
    return undefined;
  }

  validate(instance: any) {
    return false;
  }

  serialize() {
    return null;
  }

  createDescriptor(ctx: DescCtx) {
    //
    return null;
  }
}

export interface ComponentPropData {
  $$id: string;
  $$paramType: "component";
}

export class ComponentProp extends ScriptProp<
  Component3D,
  ComponentPropData,
  ComponentParam
> {
  //
  getDefault() {
    return null;
  }

  validate(instance: any) {
    //
    return (
      instance instanceof Component3D &&
      instance.componentType === this.param.typeof
    );
  }

  deserialize(ctx: DescCtx, value: ComponentPropData) {
    const { host } = ctx;
    const refId = value?.$$id;
    const id = host._dataWrapper.prefabMap?.[refId] || refId;
    if (!id) return null;
    return host.container.byInternalId(id);
  }

  serialize(value: Component3D) {
    return {
      $$id: value?.componentId || null,
      $$paramType: "component" as const,
    };
  }

  createDescriptor(ctx: DescCtx) {
    //
    return {
      get: () => {
        //
        return this.deserialize(ctx, this.getDataVal(ctx));
      },
      set: (value: Component3D) => {
        //
        this.setDataVal(ctx, this.serialize(value));
      },
    };
  }

  getGui(ctx: DescCtx): any {
    //
    const gui = super.getGui(ctx);

    gui.info ??= `Drag & drop here an object from the world items list`;

    return gui;
  }
}

export class SignalProp extends ScriptProp<
  SignalEmitter<any>,
  any,
  SignalParam
> {
  //
  getDefault() {
    return null;
  }

  validate() {
    return false;
  }

  serialize() {
    return null;
  }

  createDescriptor(ctx: DescCtx) {
    //
    const signal = new SignalEmitter();

    return {
      get: () => signal,
    };
  }
}

export interface XY {
  x: number;
  y: number;
}

export class Vector2Prop extends ScriptProp<Vector2, XY, Vec2Param> {
  //
  getDefault() {
    const def = new Vector2();
    if (this.param.defaultValue) {
      def.set(this.param.defaultValue.x, this.param.defaultValue.y);
    }
    return def;
  }

  getSchema() {
    return {
      type: "object",
      schema: this.getDefaultData(),
    };
  }

  validate(instance: any) {
    return instance instanceof Vector2;
  }

  serialize(value: Vector2) {
    return { x: value.x, y: value.y };
  }

  getGui(ctx: DescCtx) {
    //
    const gui = super.getGui(ctx);

    gui.type = "xyz";

    return gui;
  }

  createDescriptor(ctx: DescCtx) {
    //
    const instance = this.getDefault();

    this.wrapValueObj(ctx, instance, ["x", "y"]);

    return {
      get: () => instance,
      set: (value: Vector2) => {
        this.setDataVal(ctx, this.serialize(value));
      },
    };
  }
}

export interface XYZ {
  x: number;
  y: number;
  z: number;
}

export class Vector3Prop extends ScriptProp<Vector3, XYZ, Vec3Param> {
  //
  getDefault() {
    const def = new Vector3();
    if (this.param.defaultValue) {
      def.set(
        this.param.defaultValue.x,
        this.param.defaultValue.y,
        this.param.defaultValue.z
      );
    }
    return def;
  }

  getSchema() {
    return {
      type: "object",
      schema: this.getDefaultData(),
    };
  }

  validate(instance: any) {
    return instance instanceof Vector3;
  }

  serialize(value: Vector3) {
    return { x: value.x, y: value.y, z: value.z };
  }

  createDescriptor(ctx: DescCtx) {
    //
    const instance = this.getDefault();

    this.wrapValueObj(ctx, instance, ["x", "y", "z"]);

    return {
      get: () => instance,
      set: (value: Vector3) => {
        this.setDataVal(ctx, this.serialize(value));
      },
    };
  }
}

export class ObjectProp<I extends object> extends ScriptProp<
  I,
  any,
  GroupParam
> {
  //
  chidren: Record<string, ScriptProp<any, any, any>>;

  constructor(ctx: PropCtx<I, any, GroupParam>) {
    //
    super(ctx);

    this.chidren = {};

    this._createChildProps();
  }

  private _createChildProps() {
    //
    this.ctx.param.children.forEach(({ key, param: childParam }) => {
      //
      const childCtx = {
        ...this.ctx,
        param: childParam,
      };

      this.chidren[key] = ScriptProp.create(childCtx);
    });
  }

  getDefault() {
    //
    const instance = new this.param.factory();

    for (const key in this.chidren) {
      //
      const prop = this.chidren[key];

      let def = prop.getDefault();

      if (def !== undefined) {
        instance[key] = def;
      }
    }

    return instance;
  }

  getSchema() {
    //
    const schema = {};

    for (const key in this.chidren) {
      //
      const prop = this.chidren[key];

      const def = prop.getSchema();

      if (def != undefined) {
        schema[key] = def;
      }
    }

    if (Object.keys(schema).length === 0) return undefined;

    return {
      type: "object",
      schema,
    };
  }

  validate(instance: any): boolean {
    //
    return instance instanceof this.param.constructor;
  }

  serialize(value: I) {
    //
    const obj = {} as any;

    for (const key in this.chidren) {
      //
      const prop = this.chidren[key];

      obj[key] = prop.serialize(value[key]);
    }

    return obj;
  }

  getGui(ctx: DescCtx): any {
    //
    const children = {};

    for (const key in this.chidren) {
      //
      const prop = this.chidren[key];

      const dataKey = prop.ctx.param.dataKey ?? key;

      children[key] = prop.onGetGui({
        ...ctx,
        key,
        path: [...ctx.path, dataKey],
      });
    }

    return {
      type: "group",
      children,
    };
  }

  createDescriptor(ctx: DescCtx) {
    //
    const instance = this.getDefault();

    const dispose = this.wrapObject(ctx, instance);

    return {
      get: () => instance,
      set: (value: I) => {
        this.setDataVal(ctx, this.serialize(value));
      },
      dispose,
    };
  }

  wrapObject(ctx: DescCtx, object: I) {
    //
    if (object[WRAP_KEY]) return;

    Object.defineProperty(object, WRAP_KEY, {
      value: true,
      writable: false,
    });

    let descs = [];

    for (const key in this.chidren) {
      //
      const prop = this.chidren[key];

      const childPath = [...ctx.path, key];

      const childDesc = prop.createDescriptor({
        ...ctx,
        key,
        path: childPath,
      });

      if (childDesc) {
        Object.defineProperty(object, key, {
          get: childDesc.get,
          set: childDesc.set,
          configurable: true,
        });

        descs.push(childDesc);
      }
    }

    return () => {
      //
      descs.forEach((desc) => {
        //
        if (desc.dispose) desc.dispose();
      });
    };
  }
}

export class UnionProp extends ScriptProp<Tagged<any>, any, UnionParam> {
  //
  chidren: Record<string, ScriptProp<any, any, any>>;

  _guiTags: Array<{ id: string; label: string }>;

  constructor(ctx: PropCtx<Tagged<any>, any, UnionParam>) {
    //
    super(ctx);

    this.chidren = {};

    this._createChildProps();
  }

  private _createChildProps() {
    //
    this.param.options.forEach(({ tag, value }) => {
      //
      const childCtx = {
        ...this.ctx,
        param: value,
      };

      this.chidren[tag] = ScriptProp.create(childCtx);
    });

    this._guiTags = this.param.options.map(({ tag }) => ({
      id: tag,
      label: this.param.tagLabels?.[tag] ?? tag,
    }));
  }

  getDefault() {
    //
    const fstOption = this.param.options[0];

    const def = this.chidren[fstOption.tag].getDefault();

    return {
      tag: fstOption.tag,
      value: def,
    };
  }

  validate(instance: any): boolean {
    //
    return instance instanceof this.param.constructor;
  }

  serialize(value: Tagged<any>) {
    //
    return {
      tag: value.tag,
      value: this.chidren[value.tag].serialize(value.value),
    };
  }

  getGui(ctx: DescCtx): any {
    //
    return {
      type: "group",
      children: {
        tag: {
          type: "select",
          value: [ctx.host._dataWrapper._proxy, ...ctx.path],
          label: this.param.label ?? ctx.key,
          options: this._guiTags,
          nullable: false,
          mode: this.param.mode,
          format: {
            format: (v) => v.tag,
            parse: (tag, val) => {
              //
              if (tag === val.tag) return val;

              const newVal = {
                tag,
                value: this.chidren[tag].getDefaultData(),
              };

              return newVal;
            },
          },
        },
        details: () => {
          //
          const tag = this.getDataVal(ctx).tag;

          return this.chidren[tag].onGetGui({
            ...ctx,
            key: "value",
            path: ctx.path.concat("value"),
          });
        },
      },
    };
  }

  createDescriptor(ctx: DescCtx) {
    //
    const instance = {
      get tag() {
        return this.getDataVal(ctx).tag;
      },
    };

    const dispose = this.wrapObj(ctx, instance);

    return {
      get: () => instance,
      set: (value) => {
        this.setDataVal(ctx, this.serialize(value));
      },
      dispose,
    };
  }

  wrapObj(ctx: DescCtx, obj: any) {
    //
    if (obj[WRAP_KEY]) return;

    Object.defineProperty(obj, WRAP_KEY, {
      value: true,
      writable: false,
    });

    let curData = this.getDataVal(ctx);

    let curDesc = null;

    const updateDesc = (oldTag: string, newTag: string) => {
      //
      if (oldTag == newTag) return;

      curDesc?.dispose?.();

      curDesc = this.chidren[newTag].createDescriptor({
        ...ctx,
        key: "value",
        path: ctx.path.concat("value"),
      });
    };

    const disposeOwn = ctx.host._dataWrapper.onChange(() => {
      //
      const newData = this.getDataVal(ctx);

      if (newData == curData) return;

      updateDesc(curData.tag, newData.tag);

      curData = newData;
    });

    updateDesc(null, curData.tag);

    Object.defineProperty(obj, "value", {
      get: () => curDesc.get(),
    });

    return () => {
      //
      curDesc.dispose?.();

      disposeOwn();
    };
  }
}

let uid = 0;

export class ArrayProp<I = any, D = any> extends ScriptProp<
  Array<I>,
  D[],
  ArrayParam
> {
  //
  itemProp: ScriptProp<I, D, any>;

  constructor(ctx: PropCtx<I[], any[], ArrayParam>) {
    //
    super(ctx);

    this.createItemProp();
  }

  getDefault() {
    return this.param.defaultValue?.slice() ?? [];
  }

  getSchema() {
    const schema = this.itemProp.getSchema();

    if (schema == undefined) return undefined;

    return {
      type: "array",
      schema,
    };
  }

  private createItemProp() {
    //
    const itemParam = this.param.itemParam;

    this.itemProp = ScriptProp.create({
      ...this.ctx,
      param: itemParam,
    }) as any;
  }

  validate(instance: any) {
    return (
      Array.isArray(instance) &&
      instance.every((it) => this.itemProp.validate(it))
    );
  }

  serialize(value: Array<I>) {
    //
    let dataArr = [];

    value.forEach((item, i) => {
      //
      dataArr[i] = this.itemProp.serialize(item);
    });

    return dataArr;
  }

  getGui(ctx: DescCtx): any {
    //
    return {
      type: "array",
      label: () =>
        `${this.param.label || ctx.key} (${this.getDataVal(ctx).length})`,
      itemGui: (idx: number) =>
        this.itemProp.onGetGui({
          ...ctx,
          key: idx,
          path: ctx.path.concat(idx),
        }),
      itemType: this.itemProp.param.type,
      value: [ctx.host._dataWrapper._proxy, ...ctx.path],
      readonly: this.param.readonly,
      createNewData: () => {
        //
        return this.itemProp.getDefaultData();
      },
      reset: () => {
        //
        return this.getDefaultData();
      },
    };
  }

  createDescriptor(ctx: DescCtx) {
    //
    const instance = this.getDefault();

    const dispose = this.wrapArray(ctx, instance);

    return {
      get: () => instance,
      set: (value: I[]) => {
        const dataArr = value.map((item) => this.itemProp.serialize(item));
        this.setDataVal(ctx, dataArr);
      },
      dispose,
    };
  }

  wrapArray(ctx: DescCtx, array: Array<I>) {
    //
    if (array[WRAP_KEY]) return;

    Object.defineProperty(array, WRAP_KEY, {
      value: true,
      writable: false,
    });

    const impl = new ArrayParamImpl(array, this.itemProp, (fn) => {
      this.setDataVal(ctx, fn);
    });

    let curData = this.getDataVal(ctx);

    const disposeOwn = ctx.host._dataWrapper.onChange(() => {
      //
      const newData = this.getDataVal(ctx);

      if (newData == curData) return;

      curData = newData;

      impl.syncDescs(ctx, curData);
    });

    impl.syncDescs(ctx, curData);

    return () => {
      //
      disposeOwn();

      impl.descriptors.forEach((desc) => {
        //
        desc.dispose?.();
      });
    };
  }
}

interface MapDataEntry<T> {
  key: string;
  value: T;
}

type MapData<T> = Array<MapDataEntry<T>> | Record<string, T>;
export class MapProp<I = any, D = any> extends ScriptProp<
  Record<string, I>,
  MapData<D>,
  MapParam
> {
  //
  itemProp: ScriptProp<I, D, any>;

  constructor(ctx: PropCtx<Record<string, I>, MapData<I>, MapParam>) {
    //
    super(ctx);

    this.createItemProp();
  }

  getDefault() {
    return { ...(this.param.defaultValue ?? {}) };
  }

  getSchema() {
    //
    const schema = this.itemProp.getSchema();

    if (schema == undefined) return undefined;

    return {
      type: "map",
      schema,
    };
  }

  private createItemProp() {
    //
    const itemParam = this.param.itemParam;

    this.itemProp = ScriptProp.create({
      ...this.ctx,
      param: itemParam,
    }) as any;
  }

  validate(instance: any) {
    return (
      typeof instance === "object" &&
      Object.values(instance).every((it) => this.itemProp.validate(it))
    );
  }

  serialize(value: Record<string, I>) {
    //
    // For network serialization, we use a simple record
    if (this.ctx.transient) {
      return Object.keys(value).reduce((acc, key) => {
        acc[key] = this.itemProp.serialize(value[key]);
        return acc;
      }, {} as Record<string, D>);
    }

    // For gui params, we use an array of entries, because the gui can
    // be used to change keys; datawrapper needs this format
    return Object.keys(value).map((key) => {
      //
      return {
        key,
        value: this.itemProp.serialize(value[key]),
      };
    });
  }

  getGui(ctx: DescCtx): any {
    //
    return {
      type: "map",
      itemGui: (key: string, idx: number) =>
        this.itemProp.onGetGui({
          ...ctx,
          key: "value",
          path: ctx.path.concat([idx, "value"]),
        }),
      label: () =>
        `${this.param.label || ctx.key} {${this.getDataVal(ctx).length}}`,
      itemType: this.itemProp.param.type,
      value: [ctx.host._dataWrapper._proxy, ...ctx.path],
      readonly: this.param.readonly,
      validateKey: (key: string, idx: null) => {
        // ensure the key is unique
        if (
          (this.getDataVal(ctx) as any).some(
            (it, i) => i !== idx && it.key === key
          )
        ) {
          //
          throw new Error("Key already exists");
        }
      },
      createNewData: () => {
        //
        const data = this.getDataVal(ctx);

        const key = newIncId(
          "key",
          (data as any).map((it) => it.key)
        );

        return { key, value: this.itemProp.getDefaultData() };
      },
      reset: () => {
        //
        return this.getDefaultData();
      },
    };
  }

  createDescriptor(ctx: DescCtx) {
    //
    const instance = this.getDefault();

    const res = this.wrapRecord(ctx, instance);

    return {
      ...res,
      set: (value: Record<string, I>) => {
        //
        let dataVal: any = value;

        if (!this.transient) {
          dataVal = Object.keys(value).reduce((acc, key) => {
            acc.push({
              key,
              value: this.itemProp.serialize(value[key]),
            });
            return acc;
          }, [] as Array<MapDataEntry<D>>);
        }

        this.setDataVal(ctx, dataVal);
      },
    };
  }

  wrapRecord(ctx: DescCtx, object: Record<string, I>) {
    //
    if ((object as any)[WRAP_KEY]) return;

    Object.defineProperty(object, WRAP_KEY, {
      value: true,
      writable: false,
      enumerable: false,
    });

    let descriptors: Record<string | symbol, Descriptor> = {};
    let target = {};

    const syncDescs = () => {
      //
      const data = this.getDataVal(ctx);

      let prevDescs = descriptors;

      descriptors = {};

      let keys = Array.isArray(data)
        ? data.map((it) => it.key)
        : Object.keys(data);

      for (let i = 0; i < keys.length; i++) {
        //
        const key = keys[i];

        if (descriptors[key]) {
          //
          descriptors[key] = prevDescs[key];
          //
        } else {
          //
          let path = Array.isArray(data) ? [i, "value"] : [key];

          const desc = this.itemProp.createDescriptor({
            ...ctx,
            key,
            path: ctx.path.concat(path),
          });

          descriptors[key] = desc;
        }

        target[key] = descriptors[key].get();
      }

      Object.keys(prevDescs).forEach((key) => {
        //
        if (!descriptors[key]) {
          //
          prevDescs[key].dispose?.();

          delete target[key];
        }
      });
    };

    syncDescs();

    const proxy = new Proxy(target, {
      get: (target, key: any) => {
        //
        if (key === WRAP_KEY) return true;

        let desc = descriptors[key];

        return desc?.get();
      },
      set: (target, key: any, value) => {
        //
        if (key === WRAP_KEY) return false;

        const dataVal = this.getDataVal(ctx);

        if (Array.isArray(dataVal)) {
          this.setDataVal(ctx, [...dataVal, { key, value }]);
        } else {
          this.setDataVal(ctx, { ...dataVal, [key]: value });
        }

        return true;
      },
      deleteProperty: (target, key: any) => {
        //
        if (key === WRAP_KEY) return false;

        const dataVal = this.getDataVal(ctx);

        if (Array.isArray(dataVal)) {
          this.setDataVal(
            ctx,
            dataVal.filter((it) => it.key !== key)
          );
        } else {
          const newVal = { ...dataVal };
          delete newVal[key];
          this.setDataVal(ctx, newVal);
        }

        return true;
      },
    });

    const dispose = ctx.host._dataWrapper.onChange(() => {
      //
      syncDescs();
    });

    return {
      get: () => proxy,
      dispose: () => {
        //
        dispose();

        for (let key in descriptors) {
          //
          descriptors[key].dispose?.();
        }
      },
    };
  }
}

export interface BindData {
  $$id: string;
  $$path: string;
  $$paramType: "bind";
}

export class BoundProp extends ScriptProp<any, any, any> {
  //
  getDefault() {
    return { $$id: null, $$path: null, $$paramType: "bind" as const };
  }

  validate(instance: any) {
    return false;
  }

  serialize() {
    return null;
  }

  deserialize(ctx: DescCtx, bindData: any, _: any) {
    //
    const source = ctx.host._getRef(bindData?.$$id);

    if (!source) return;

    const path = bindData?.$$path?.split(".");

    if (!path?.length) return null;

    return this.getVal(source, path);
  }

  createDescriptor(ctx: DescCtx) {
    //
    const host = ctx.host;

    const path = ctx.path as any;

    const initialValue = this.getDataVal(path);

    ctx.host._dataWrapper.addToDependencies(initialValue.$$id);

    return {
      get: () => {
        //
        const bindData = host._dataWrapper.get(path);

        return this.deserialize(ctx, bindData, null);
      },
    };
  }
}
