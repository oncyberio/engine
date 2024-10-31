// @ts-check

import AugmentedGroup from "engine/abstract/augmentedgroup";
import { Box3, Euler, Matrix4, Mesh, Quaternion, Vector3 } from "three";
import type { ComponentData } from "engine/@types/game";
import type { ComponentInfo, TransformConfigOpts } from "./componentinfo";
import type { Space } from "engine/space/wrapper";
import type {
  ComponentManager,
  CreateComponentOpts,
} from "engine/space/components";
import {
  CollisionEnterEvent,
  CollisionExitEvent,
  SensorEvent,
} from "engine/components/physics/rapier/constants";
import { Component3DEditor } from "engine/space/shared/uieditor";
import { RigidBodyWrapper } from "engine/components/physics/rapier/rigidbody";
import { Collider } from "engine/components/physics/rapier/rigidbody/collider";
import { Component3DData } from "./component3Ddata";
import { ComponentFactory } from "./componentfactory";
import { DataWrapper } from "engine/space/datamodel/datawrapper";
import { PrefabResource } from "engine/space/resources/prefabs/prefabresource";
import { ParamsParser } from "engine/space/params/parser";
import { ParamsBinder } from "engine/space/params/binder";

import Emitter from "engine/events/emitter";

import Events from "engine/events/events.js";
import { IS_EDIT_MODE } from "engine/constants";
import type { ScriptBehavior } from "engine/space/resources/scripts/api/scriptbehavior";
import type { ScriptHost } from "engine/space/resources/scripts/scriptfactory/scripthost";
import { ComponentTypeMap, CType } from "engine/space/components/components";
import { LOAD_TIMEOUT, withTimeout } from "engine/utils/js";
import { NetIds } from "engine/space/shared/NetIds";
//
const ACTIVE_COLLISION_EVENTS = {
  COLLISION_ENTER: "COLLISION_ENTER",
  COLLISION_STAY: "COLLISION_STAY",
  COLLISION_EXIT: "COLLISION_EXIT",
  //
  SENSOR_ENTER: "SENSOR_ENTER",
  SENSOR_STAY: "SENSOR_STAY",
  SENSOR_EXIT: "SENSOR_EXIT",
} as const;

const EVENTS = {
  CHILD_ADDED: "CHILD_ADDED",
  CHILD_REMOVED: "CHILD_REMOVED",
  CHILDREN_LOADED: "CHILDREN_LOADED",
  MATRIX_CHANGED: "MATRIX_CHANGED",
  READY: "READY",
  ATTACHED: "ATTACHED",
  DISPOSED: "DISPOSED",
  ...ACTIVE_COLLISION_EVENTS,
} as const;

interface EventListeners {
  [EVENTS.MATRIX_CHANGED]: (component: Component3D) => void;
  [EVENTS.DISPOSED]: () => void;
  [EVENTS.READY]: () => void;
  [EVENTS.COLLISION_ENTER]: (collision: CollisionEnterEvent) => void;
  [EVENTS.COLLISION_STAY]: (collision: CollisionEnterEvent) => void;
  [EVENTS.COLLISION_EXIT]: (collision: CollisionExitEvent) => void;
  //
  [EVENTS.SENSOR_ENTER]: (event: SensorEvent) => void;
  [EVENTS.SENSOR_STAY]: (event: SensorEvent) => void;
  [EVENTS.SENSOR_EXIT]: (event: SensorEvent) => void;
}

export interface ComponentOpts {
  space: Space;
  container: ComponentManager;
  info: ComponentInfo;
  data: ComponentData;
}

export interface DataChangeOpts<
  Data extends Component3DData = Component3DData
> {
  prev: Data;
  isProgress: boolean;
}

const identityMatrix = new Matrix4();

export const OPTS = Symbol("@oo/options");

const coordsFields = {
  position: true,
  rotation: true,
  scale: true,
} as const;

type ChangeHandlers<T extends {}> = {
  [K in keyof T]?: (value: T[K]) => void | Promise<void>;
};

/**
 * @public
 */
export class Component3D<
  Data extends Component3DData = Component3DData
> extends AugmentedGroup {
  /**
   * @internal
   */
  EVENTS = EVENTS;

  /**
   * @internal
   */
  isComponent = true;

  /**
   * Collider for this component, it encapsulates some convenience methods for physics
   * And gives access to the underlying physics rigidbody and collider
   */
  collider: Collider = null;

  /**
   * Rigid body attached to this component, it encapsulates some convenience methods for physics
   * And gives access to the underlying physics rigidbody and colliders
   *
   * you can find more info at {@link RigidBodyWrapper}
   */
  rigidBody: RigidBodyWrapper = null;

  /**
   * geometry prop is not allowed on components
   */
  geometry: never;

  /**
   * material prop is not allowed on components
   */
  material: never;

  /**
   * @internal
   */
  [OPTS] = {
    persistent: false,
    createdOnInit: false,
  };

  public space: Space;

  /**
   * @internal
   */
  public container: ComponentManager;

  /**
   * @internal
   */
  public info: ComponentInfo;

  /**
   * @internal
   */
  public wasDisposed: boolean;

  /**
   * @internal
   */
  get _componentFactory(): ComponentFactory<Component3D> {
    //
    const registry = this.space.registry;

    return registry.componentTypes[this.opts.data.type as any];
  }

  /**
   * @internal
   */
  _dataWrapper: DataWrapper<Data>;

  private _currentData: Data;

  /**
   * @internal
   */
  _paramsBinder: ParamsBinder;

  /**
   * @internal
   */
  protected _changeCallbacks: ChangeHandlers<this["data"]> = {};

  private _changeCallbackKeys: string[] = null;

  private _behaviors: ScriptBehavior[] = [];

  private _sessionId = "";

  /**
   * @internal
   */
  _isLoading = true;

  /**
   * @internal
   */
  constructor(protected opts: ComponentOpts) {
    //
    super();

    if (opts) {
      //
      this.space = opts.space;

      this.container = opts.container;

      if (!IS_EDIT_MODE) {
        //
        if (!opts.data._netBase) {
          opts.data._netBase = opts.data.id;
        }

        opts.data._netId ??= NetIds.nextId(this.container, opts.data._netBase);
      }

      this._initDataWrapper(opts.data);

      this.info = opts.info;

      this.name = this.data.name || this.data.id;
    }
  }

  get sessionId() {
    //
    return this._sessionId;
  }

  set sessionId(value) {
    //
    value = value || "";

    this._sessionId = value;

    this.childComponents.forEach((c) => {
      //
      c.sessionId = value;
    });
  }

  /**
   * @internal
   */
  get _rpcId() {
    //
    return `${this.data._netBase}/${this.data._netId}/${this.sessionId}`;
  }

  private _initDataWrapper(data) {
    //
    const skipMerge = !IS_EDIT_MODE;

    if (data.prefabId == null) {
      //
      this._dataWrapper = this._componentFactory.baseDataWrapper.derive(data, {
        skipMerge,
      }) as any;
      //
    } else {
      //
      const prefab = this.space.resources.getPrefab(data.prefabId);

      this._dataWrapper = prefab._dataWrapper.derive(data, {
        skipMerge,
      }) as any;
    }

    this._currentData = { ...this.data };

    this._dataWrapper.onChange(this._dataChangeListener);
  }

  get data() {
    //
    return this._dataWrapper.data as Data;
  }

  /** @internal */
  _paramsConfig: any;

  /**
   * @internal
   */
  _initParams() {
    //
    if (this._paramsConfig) return;

    const config = ParamsParser.getConfig(this, true);

    if (config != null) {
      //
      this._paramsConfig = config;

      this._paramsBinder = new ParamsBinder(this, this, config);
    }
  }

  /**
   * @internal
   */
  async onInit() {
    //
    this._initParams();

    if (this.info.transform) {
      this._updateTransform(null);
    }

    if (!IS_EDIT_MODE) {
      await withTimeout(this.init(), this.info.initTimeout || LOAD_TIMEOUT);
    } else {
      await this.init();
    }

    if (this.wasDisposed) return;

    this._currentData = { ...this.data };

    try {
      this.container.loaded.then(() => {
        //
        if (this.wasDisposed) return;

        this.emit(EVENTS.READY);

        this._onReady();
      });
    } catch (e) {
      debugger;
    }
  }

  /**
   * @internal
   */
  async _onReady() {}

  /**
   * @internal
   */
  _onDispose() {
    if (this.wasDisposed) return;

    this.wasDisposed = true;

    this.emit(this.EVENTS.DISPOSED);

    this.dispose();

    this._dataWrapper.dispose();

    this.space = null;

    this.container = null;

    this.opts = null;
  }

  /**
   * @internal
   */
  protected _assignXYZ(field, source) {
    //
    const target = this.data[field];

    if (source == null || target == null) return null;

    if (
      this.data.prefabId &&
      source.x == target.x &&
      source.y == target.y &&
      source.z == target.z
    ) {
      //
      return target;
    }

    let res: any = {};

    if (source.x != null && target.x != null) res.x = source.x;
    if (source.y != null && target.y != null) res.y = source.y;
    if (source.z != null && target.z != null) res.z = source.z;

    this._dataWrapper.set(field, res);

    return res;
  }

  /**
   * @internal
   */
  getTransformData() {
    //
    const data = this.data as any;

    const tdata: any = {};

    if (data.position) tdata.position = { ...data.position };
    if (data.rotation) tdata.rotation = { ...data.rotation };
    if (data.scale) tdata.scale = { ...data.scale };

    return tdata;
  }

  /**
   * @internal
   *
   * Update data transform from component transform
   */
  syncWithTransform(isProgress = false) {
    this._isProgress = true;
    //
    try {
      this._dataWrapper.pauseNotifications();

      this._assignXYZ("position", this.position);

      this._assignXYZ("rotation", this.rotation);

      this._assignXYZ("scale", this.scale);
      //
    } finally {
      //
      this._dataWrapper.resumeNotifications();
    }
  }

  /**
   * @internal
   */
  _updateTransform(
    opts: DataChangeOpts | null,
    fields: TransformConfigOpts = this.info.transform ?? coordsFields
  ) {
    //
    if (fields === false) return;

    const data = this.data as any;
    const prev = opts?.prev as any;

    if (fields === true) {
      //
      fields = coordsFields;
    }

    if (fields?.position && prev?.position !== data.position) {
      this.position.copy(data.position);
    }

    if (fields?.rotation && prev?.rotation !== data.rotation) {
      const r = data.rotation;
      this.rotation.set(r.x, r.y, r.z);
    }

    if (fields?.scale && prev?.scale !== data.scale) {
      this.scale.copy(data.scale);
    }
  }

  protected async init() {}

  /**
   * @internal
   */
  onDataChange(opts: DataChangeOpts<Data>) {}

  private _dataChangeScheduled = false;

  /**
   * @internal
   */
  _isProgress = false;

  _dataChangeListener = () => {
    // currently needed for script host to sync with scripts instance data asap
    // in order for component gui to update
    if (this._dataChangeScheduled) return;

    this._dataChangeScheduled = true;

    Emitter.once(Events.PRE_UPDATE, this._onDataChange);

    // setTimeout(this._onDataChange);
  };

  private _onDataChange = () => {
    try {
      //
      if (this.wasDisposed) return;

      this._dataChangeScheduled = false;

      const opts: DataChangeOpts<any> = {
        isProgress: this._isProgress,
        prev: this._currentData,
      };

      if (this.data.prefabId != opts.prev.prefabId) {
        //
        this._updatePrefabMap();
      }

      if (opts.prev.script !== this.data.script) {
        //
        this.container._updateComponentScriptId(
          this,
          this.data.script?.identifier,
          opts.prev.script?.identifier
        );

        this.container._updateComponentTag(
          this,
          this.data.script?.tag,
          opts.prev.script?.tag
        );
      }

      this._updateTransform(opts);

      if (this._changeCallbackKeys == null) {
        //
        this._changeCallbackKeys = Object.keys(this._changeCallbacks);
      }

      for (let i = 0; i < this._changeCallbackKeys.length; i++) {
        //
        const key = this._changeCallbackKeys[i];

        const handler = this._changeCallbacks[key];

        if (handler && this.data[key] !== this._currentData[key]) {
          //
          handler.call(this, this.data[key], opts);
        }
      }

      this.onDataChange(opts);

      this.emit("data", { data: this.data, prev: this._currentData });

      this._currentData = { ...this.data };
    } finally {
      this._isProgress = false;
    }
  };

  /**
   * @internal
   */
  _updateData(data: Partial<Data>) {
    //
    this._dataWrapper.assign(data);
  }

  /**
   * @internal
   */
  _updatePrefabMap() {
    const prefabId = this.data.prefabId;
    if (!prefabId || !this._dataWrapper.prefabMap) return;
    this._dataWrapper.prefabMap[prefabId] = this.componentId;
  }

  /**
   * @internal
   */
  _computePrefabMap(map?: any) {
    if (!this.data.prefabId) return;
    map ??= (this.parent as Component3D)?._dataWrapper?.prefabMap;
    map ??= this._dataWrapper._resetPrefabMap();
    this._dataWrapper.prefabMap = map;
    this._updatePrefabMap();
    this.childComponents.forEach((c) => c._computePrefabMap(map));
  }

  /**
   * map is id => prefabId
   * @internal
   */
  _internalizeRefs(map?: any) {
    map ??= Object.entries(this._dataWrapper.prefabMap || {}).reduce(
      (acc, [key, value]) => {
        acc[value] = key;
        return acc;
      },
      {}
    );
    this._dataWrapper.internalizeRefs(map);
    this.childComponents.filter((c) => c._internalizeRefs(map));
  }

  /**
   * @internal
   */
  add(object) {
    //

    super.add(object);

    this._behaviors = this.children.filter(
      (c: ScriptHost) => c.isBehavior
    ) as ScriptBehavior[];

    if (object instanceof Component3D) {
      this.emit(EVENTS.CHILD_ADDED, object);
      if (this._isLoading == false && object.isPersistent) {
        this._emitChildrenLoaded();
      }

      object.emit(EVENTS.ATTACHED);
    }

    return this;
  }

  /**
   * @internal
   */
  _emitChildrenLoaded() {
    //
    this.emit(
      EVENTS.CHILDREN_LOADED,
      this.childComponents.filter((c) => c.isPersistent)
    );
  }

  /**
   * @internal
   */
  remove(object) {
    //
    super.remove(object);

    this._behaviors = this.children.filter(
      (c: ScriptHost) => c.isBehavior
    ) as ScriptBehavior[];

    if (object instanceof Component3D) {
      this.emit(EVENTS.CHILD_REMOVED, object);
      if (this._isLoading == false && object.isPersistent) {
        this._emitChildrenLoaded();
      }
    }

    return this;
  }

  protected dispose() {}

  private _prevMatrix = new Matrix4();

  private _needsDecompose = true;
  private _worldPos = new Vector3();
  private _worldQuat = new Quaternion();
  private _worldSc = new Vector3(1, 1, 1);
  private _worldRot = new Euler();

  private _needsInv = true;
  private _matWorldInv = new Matrix4();
  private _worldQuatInv = new Quaternion();

  /**
   * @internal
   */
  updateMatrixWorld(force) {
    //
    super.updateMatrixWorld(force);

    if (!this.matrixWorld.equals(this._prevMatrix)) {
      //
      this._prevMatrix.copy(this.matrixWorld);

      this._needsDecompose = true;

      this._needsInv = true;

      this.emit(EVENTS.MATRIX_CHANGED, this);
    }
  }

  private _isParentIdentity() {
    //
    return (
      this.parent === this.container ||
      this.parent?.matrixWorld.equals(identityMatrix)
    );
  }

  private _decomposeWorldMatrix() {
    //
    if (this._isParentIdentity()) {
      //
      this._worldPos.copy(this.position);

      this._worldQuat.copy(this.quaternion);

      this._worldSc.copy(this.scale);
    } else {
      //
      this.matrixWorld.decompose(
        this._worldPos,
        this._worldQuat,
        this._worldSc
      );
    }

    this._needsDecompose = false;
  }

  private _inverse() {
    //
    this._matWorldInv.copy(this.matrixWorld).invert();
    this._worldQuatInv.copy(this._worldQuat).invert();

    this._needsInv = false;
  }

  /**
   * the position in world space
   */
  get positionWorld() {
    if (this._needsDecompose) {
      this._decomposeWorldMatrix();
    }
    return this._worldPos;
  }

  /**
   * the quaternion in world space
   */
  get quaternionWorld() {
    if (this._needsDecompose) {
      this._decomposeWorldMatrix();
    }
    return this._worldQuat;
  }

  /**
   * the rotation in world space
   */
  get rotationWorld() {
    if (this._needsDecompose) {
      this._decomposeWorldMatrix();
    }
    this._worldRot.setFromQuaternion(this._worldQuat);
    return this._worldQuat;
  }

  /**
   * the scale in world space
   */
  get scaleWorld() {
    if (this._needsDecompose) {
      this._decomposeWorldMatrix();
    }
    return this._worldSc;
  }

  /**
   * @internal
   */
  get _matrixWorldInv() {
    if (this._needsInv) {
      this._inverse();
    }
    return this._matWorldInv;
  }

  /**
   * @internal
   */
  get _worldQuaternionInv() {
    if (this._needsInv) {
      this._inverse();
    }
    return this._worldQuatInv;
  }

  /**
   * @internal
   */
  _setWorldPosAndQuat(worldPos: Vector3, worldQuat: Quaternion) {
    //
    if (this._isParentIdentity()) {
      //
      this.position.copy(worldPos);

      this._worldPos.copy(worldPos);

      this.quaternion.copy(worldQuat);

      this._worldQuat.copy(worldQuat);
      //
    } else {
      // Hack to avoid propagating childrenDirty flag to parent
      // @ts-ignore
      this.matrixWorld.compose(worldPos, worldQuat, this.scaleWorld);

      let parentMatInv = (this.parent as Component3D)._matrixWorldInv;

      if (parentMatInv == null) return;

      this.matrix.copy(this.matrixWorld).premultiply(parentMatInv);

      this.matrix.decompose(this.position, this.quaternion, this.scale);

      // Hack to avoid propagating childrenDirty flag to parent
      // @ts-ignore
      this.matrixNeedsUpdate = false;

      this.matrixWorldNeedsUpdate = false;

      // @ts-ignore
      this.childrenNeedsUpdate = true;

      this.updateMatrixWorld(false);

      this._worldPos.copy(worldPos);

      this._worldQuat.copy(worldQuat);

      this._needsDecompose = false;
    }
  }

  /**
   * @internal
   */
  _setWorldPosition(worldPos: Vector3) {
    //
    if (this._isParentIdentity()) {
      //
      this.position.copy(worldPos);

      this._worldPos.copy(worldPos);
      //
    } else {
      //
      this._setWorldPosAndQuat(worldPos, this.quaternionWorld);
    }
  }

  /**
   * @internal
   */
  _setWorldQuaternion(worldQuat: Quaternion) {
    //
    if (this._isParentIdentity()) {
      //
      this.quaternion.copy(worldQuat);

      this._worldQuat.copy(worldQuat);
      //
    } else {
      //
      this._setWorldPosAndQuat(this.positionWorld, worldQuat);
    }
  }

  on(event: string, listener: (...args: any[]) => unknown) {
    //
    super.on(event, listener);

    if (ACTIVE_COLLISION_EVENTS[event] && this.rigidBody) {
      this.rigidBody.__updateActiveEvents();
    }

    return () => {
      this.off(event, listener);
    };
  }

  off(event: string, listener: (...args: any[]) => unknown) {
    //
    super.off(event, listener);

    if (ACTIVE_COLLISION_EVENTS[event] && this.rigidBody) {
      this.rigidBody.__updateActiveEvents();
    }
  }

  /**
   * @internal
   */
  onMatrixChanged(cb: EventListeners[typeof EVENTS.MATRIX_CHANGED]) {
    //
    return this.on(EVENTS.MATRIX_CHANGED, cb);
  }

  /**
   * @internal
   */
  offMatrixChanged(cb: EventListeners[typeof EVENTS.MATRIX_CHANGED]) {
    //
    this.off(EVENTS.MATRIX_CHANGED, cb);
  }

  /**
   * Event fired when this component starts colliding with another component
   */
  onCollisionEnter(cb: EventListeners[typeof EVENTS.COLLISION_ENTER]) {
    //
    return this.on(EVENTS.COLLISION_ENTER, cb);
  }

  /**
   * Event fired when this component stops colliding with another component
   */
  onCollisionExit(cb: EventListeners[typeof EVENTS.COLLISION_EXIT]) {
    //
    return this.on(EVENTS.COLLISION_EXIT, cb);
  }

  /**
   * This event is fired each frame between the start and end of a collision
   */
  onCollisionStay(cb: EventListeners[typeof EVENTS.COLLISION_STAY]) {
    //
    return this.on(EVENTS.COLLISION_STAY, cb);
  }

  /**
   * Event fired when this component starts intersecting a sensor
   */
  onSensorEnter(cb: EventListeners[typeof EVENTS.SENSOR_ENTER]) {
    return this.on(EVENTS.SENSOR_ENTER, cb);
  }

  /**
   * Event fired when this component stops intersecting a sensor
   */
  onSensorExit(cb: EventListeners[typeof EVENTS.SENSOR_EXIT]) {
    return this.on(EVENTS.SENSOR_EXIT, cb);
  }

  /**
   * This event is fired each frame between the start and end of a sensor intersection
   */
  onSensorStay(cb: EventListeners[typeof EVENTS.SENSOR_STAY]) {
    return this.on(EVENTS.SENSOR_STAY, cb);
  }

  /**
   * Returns the unique id for this component
   */
  get componentId() {
    return this.data.id;
  }

  /**
   * Returns the name of this component (if set in data.name)
   */
  get componentName() {
    return this.data.name;
  }

  /**
   * Returns the type of this component (avatar, model, etc)
   */
  get componentType() {
    return this.data.type;
  }

  /**
   * Returns the unique identifier for this component
   */
  get identifier() {
    return this.data.script?.identifier;
  }

  /**
   * Returns the group identifier for this component
   */
  get tag() {
    //
    return this.data.script?.tag;
  }

  /**
   * @internal
   */
  _sortChildren() {
    //
    this.children.sort((a, b) => {
      //
      const aIndex = (a as any).data?._index ?? Number.MAX_SAFE_INTEGER;
      const bIndex = (b as any).data?._index ?? Number.MAX_SAFE_INTEGER;

      return aIndex - bIndex;
    });

    if (!this._isLoading) {
      this._emitChildrenLoaded();
    }
  }

  get childComponents(): Component3D[] {
    // return child components sorted by their data._index property
    return this.children
      .filter((c) => c instanceof Component3D)
      .sort((a, b) => {
        //
        return a.data._index - b.data._index;
        //
      }) as Component3D[];
  }

  get behaviors(): ScriptBehavior[] {
    return this._behaviors;
  }

  get parentComponent(): Component3D {
    //
    if (this.parent instanceof Component3D) {
      return this.parent as Component3D;
    }

    return null;
  }

  /**
   * Returns true if this component is a dierct or indirect child of the provided component
   */
  isDescendantOf(component: Component3D) {
    //
    let parent = this.parent;

    while (parent != null) {
      //
      if (parent === component) return true;

      parent = parent.parent;
    }

    return false;
  }

  protected _onCreateCollisionMesh() {
    //
    return null;
  }

  #collisionMesh: Mesh = null;

  /**
   * @internal
   */
  getCollisionMesh(): Mesh {
    //
    if (this.#collisionMesh == null) {
      //
      this.#collisionMesh = this._onCreateCollisionMesh();

      if (this.#collisionMesh != null) {
        //
        this.add(this.#collisionMesh);
      }
    }

    return this.#collisionMesh;
  }

  /**
   * @internal
   */
  _getCollisionInfo(opts) {
    return opts;
  }

  /**
   * @internal
   */
  protected _componentBBox = new Box3();

  /**
   * Returns the bounding box of this component
   *
   * @param target - The target to set the bounding box to, if not provided a new Box3 will be returned
   */
  getBBox(target = this._componentBBox) {
    //
    return this._getBBoxImp(target);
  }

  /**
   * @internal
   */
  protected _getBBoxImp(target: Box3) {
    target.setFromObject(this);

    // safegard for never 0 bbox size
    target.min.addScalar(-Number.EPSILON);
    target.max.addScalar(Number.EPSILON);

    return target;
  }

  get isPersistent() {
    //
    return this[OPTS].persistent;
  }

  /**
   * @internal
   */
  protected _componentDimensions = new Vector3();

  /**
   * Returns the dimensions of this component
   *
   * @param target - The target to set the dimensions to, if not provided a new Vector3 will be returned
   */
  getDimensions(target = this._componentDimensions) {
    const box = this.getBBox();

    box.getSize(target);

    return target;
  }

  /**
   * Duplicate this component
   *
   * Returns a promise that resolves with the duplicated component
   */
  duplicate(opts?: CreateComponentOpts): Promise<this> {
    return this.container.duplicate(this, opts) as any;
  }

  get isBehavior() {
    //
    return false;
  }

  getBehavior<T extends ScriptBehavior>(type: new (...args: any) => T) {
    return this.children.find((c) => c instanceof type) as T;
  }

  getBehaviors<T extends ScriptBehavior>(type: new (...args: any) => T) {
    return this.children.filter((c) => c instanceof type) as T[];
  }

  /**
   * @internal
   */
  get editor() {
    //
    return null;
  }

  /**
   * Destroy this component
   */
  destroy() {
    if (this.container != null) {
      this.container.destroy(this);
    }
  }

  /**
   * @internal
   */
  getDataNode(opts: { template?: boolean } = {}) {
    //
    const data = structuredClone(this._dataWrapper.ownData);

    if (opts.template) {
      //
      delete data.id;
      delete data.script?.identifier;
      delete data.parentId;
    }

    const children = {};

    this.childComponents.forEach((c) => {
      //
      if (!c.isPersistent) return;

      children[c.data.id] = c.getDataNode(opts);
    });

    return {
      ...data,
      children,
    } as any;
  }

  /**
   * @internal
   */
  get ownData() {
    //
    return this._dataWrapper.ownData;
  }

  /**
   * @internal
   */
  get prefab() {
    //
    if (!this.data.prefabId) return null;

    return this.space.resources.getPrefab(this.data.prefabId);
  }

  /**
   * @internal
   */
  _canBatchDraw() {
    //
    const disallowed = ["group", "text", "godray", "iframe"];
    return (
      !disallowed.includes(this.info.type) &&
      this.info.batchDraw !== false &&
      !this.info.singleton &&
      this.getCollisionMesh() != null
    );
  }

  /**
   * @internal
   */
  _getRef(refId: string) {
    //
    refId = this._dataWrapper.getRefId(refId);

    if (!refId) return null;

    return this.container.byInternalId(refId);
  }
}
