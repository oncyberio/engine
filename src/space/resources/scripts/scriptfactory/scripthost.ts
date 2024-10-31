import {
  Component3D,
  ComponentOpts,
  DataChangeOpts,
} from "engine/abstract/component3D";
import Events from "engine/events/events";
import { ScriptEmitter } from "engine/space/resources/scripts/api/scriptemitter";
import { ScriptResource } from "engine/space/resources/scripts/scriptresource";
import { hasOwn } from "engine/utils/js";
import { ScriptComponent } from "../api/scriptcomponent";
import { ScriptEditorCtx } from "./ScriptEditorCtx";
import { ParamsBinder, ParamsParser } from "engine/space/params";

export interface ScriptComponentOpts extends ComponentOpts {
  emitter: ScriptEmitter;
  module: ScriptResource;
  disabled: boolean;
}

/**
 * @public
 * @public
 */
export class ScriptHost extends Component3D<any> {
  //
  private _impl_: ScriptHostImpl;

  /**
   * @internal
   */
  constructor(protected opts: ScriptComponentOpts) {
    //
    super(opts);

    if (opts) {
      //
      this._impl_ = new ScriptHostImpl(opts, this);
    }
  }

  get instance() {
    //
    return this._impl_.instance;
  }

  get editorCtx() {
    //
    return this._impl_.editorCtx;
  }

  /**
   * @internal
   */
  syncWithTransform() {
    //
    if (!this.info.transform) return;

    super.syncWithTransform();
  }

  /**
   * @internal
   */
  async init() {
    return this._impl_.init();
  }

  /**
   * @internal
   */
  getCollisionMesh() {
    //
    return this._impl_.getCollisionMesh();
  }

  get isBehavior() {
    //
    return this._impl_.module.isBehavior;
  }

  /**
   * @internal
   */
  onDataChange(opts: DataChangeOpts): void {
    //
    this._impl_.onDataChange(opts);
  }

  /**
   * @internal
   */
  dispose() {
    //
    this._impl_?.dispose();

    this._impl_ = null;
  }
}

const WRAP_KEY = Symbol("wrapXYZ");

class ScriptHostImpl {
  //
  editorCtx: ScriptEditorCtx;

  instance: ScriptComponent;

  instanceValues = {};

  disposers = [];

  _paramsBinder: ParamsBinder;

  _lastError = null;

  constructor(public opts: ScriptComponentOpts, public host: ScriptHost) {
    this.editorCtx = new ScriptEditorCtx(this);

    this.createInstance();
  }

  get module() {
    //
    return this.opts.module;
  }

  createInstance() {
    //
    const module = this.module;

    const prototype = module.exports?.default;

    if (prototype === this.host.constructor) {
      //
      this.instance = this.host as any;
      //
    } else if (typeof prototype === "function") {
      //
      this.instance = new (prototype as any)();
    } else {
      //
      this.instance = Object.create(prototype);
    }

    if (this.instance !== this.host) {
      // legacy components defned via decorators
      (this.instance as any).host = this.host;

      Object.defineProperty(this.instance, "data", {
        get: () => this.host.data,
      });

      Object.defineProperty(this.instance, "parent", {
        get: () => this.host.parentComponent,
      });

      Object.defineProperty(this.instance, "children", {
        get: () => this.host.children,
      });

      const config = ParamsParser.getConfig(this.instance);

      if (config != null) {
        //
        this._paramsBinder = new ParamsBinder(this.host, this.instance, config);
      }
    }
  }

  async init() {
    //

    if (!this.opts.disabled) {
      //
      await this.attachGameEvents();
    }

    const unsuscribeChildrenLoaded = this.host.on(
      this.host.EVENTS.CHILDREN_LOADED,
      (children) => {
        this.host.instance.onChildrenLoaded?.(children);
      }
    );

    this.disposers.push(unsuscribeChildrenLoaded);

    const unsuscribeChildrenAttached = this.host.on(
      this.host.EVENTS.ATTACHED,
      () => {
        this.host.instance.onAttached?.();
      }
    );

    this.disposers.push(unsuscribeChildrenAttached);

    await Promise.resolve(this.instance.onRenderInit?.()).catch((err) => {
      //
      this._lastError = err;

      console.error(err);
    });

    if (this.instance["geometry"] || this.instance["material"]) {
      //
      delete this.instance["geometry"];

      delete this.instance["material"];

      this._lastError = new Error(
        "Script component should not have geometry or material"
      );

      console.error(this._lastError);
    }

    // onFrame event is available in both playing and edit mode

    this.subscribeIfDefined(Events.GAME_FRAME, "onFrame");
  }

  onDataChange(opts: DataChangeOpts) {
    //
    try {
      //
      this.instance.onRenderUpdate?.(opts);
    } catch (err) {
      //
      this._lastError = err;
      console.error(err);
    }
  }

  getCollisionMesh() {
    //
    return this.instance?.onGetCollisionMesh?.();
  }

  subscribe(event, callback, emitter: any = this.opts.emitter) {
    //
    if (typeof callback !== "function") return;

    const handler = callback.bind(this.host.instance);

    emitter.on(event, handler);

    this.disposers.push(() => {
      emitter.off(event, handler);
    });
  }

  hasDefinedMethod(obj, key) {
    //
    return (
      hasOwn(obj, key) ||
      (hasOwn(Object.getPrototypeOf(obj), key) &&
        typeof obj[key] === "function")
    );
  }

  subscribeIfDefined(event, key, emitter: any = this.opts.emitter) {
    //
    if (this.hasDefinedMethod(this.host.instance, key)) {
      //
      this.subscribe(event, this.host.instance[key], emitter);
    }
  }

  async attachGameEvents() {
    //

    const callbacks = this.host.instance;

    if (this.hasDefinedMethod(callbacks, "onPreload")) {
      await Promise.resolve(callbacks.onPreload());
    }

    if (this.hasDefinedMethod(callbacks, "onReady")) {
      //
      const dispose = this.opts.emitter._addReadyTask(() =>
        Promise.resolve(callbacks.onReady())
      );

      this.disposers.push(dispose);
    }

    this.host.container.loaded.then(() => {
      //
      if (this.hasDefinedMethod(callbacks, "onLoad")) {
        //
        this.opts.container.addLoadTask(Promise.resolve(callbacks.onLoad()));
      }

      this.attachHandlers();
    });

    this.subscribeIfDefined(Events.GAME_START, "onStart");

    this.subscribeIfDefined(Events.GAME_END, "onEnd");

    this.subscribeIfDefined(Events.GAME_UPDATE, "onUpdate");

    this.subscribeIfDefined(Events.GAME_FIXED_UPDATE, "onFixedUpdate");

    this.subscribeIfDefined(Events.GAME_DAWN_UPDATE, "onDawnUpdate");

    this.subscribeIfDefined(Events.GAME_NOTIFY_PAUSE, "onPause");

    this.subscribeIfDefined(Events.GAME_NOTIFY_RESUME, "onResume");
  }

  attachHandlers() {
    //
    if (this.host === this.host.instance) {
      const HOST_EVENTS = this.host.EVENTS;

      const emitter = this.module.isBehavior
        ? (this.instance as any).host
        : this.host;

      this.subscribeIfDefined(
        HOST_EVENTS.SENSOR_ENTER,
        "handleSensorEnter",
        emitter
      );

      this.subscribeIfDefined(
        HOST_EVENTS.SENSOR_EXIT,
        "handleSensorExit",
        emitter
      );

      this.subscribeIfDefined(
        HOST_EVENTS.SENSOR_STAY,
        "handleSensorStay",
        emitter
      );

      this.subscribeIfDefined(
        HOST_EVENTS.COLLISION_ENTER,
        "handleCollisionEnter",
        emitter
      );

      this.subscribeIfDefined(
        HOST_EVENTS.COLLISION_EXIT,
        "handleCollisionExit",
        emitter
      );

      this.subscribeIfDefined(
        HOST_EVENTS.COLLISION_STAY,
        "handleCollisionStay",
        emitter
      );
    }
  }

  private _wasDisposed = false;

  dispose() {
    //
    if (this._wasDisposed) return;

    try {
      this._wasDisposed = true;

      this.instance.onRenderDispose?.();
      this.instance.onDispose?.();
      this.instance = null;

      this.disposers.forEach((d) => d());
      this.disposers = [];
    } catch (err) {
      console.error(err);
    }
  }
}
