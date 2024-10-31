import Emitter from "engine/events/emitter";
import { Component3D } from "engine/abstract/component3D";
import { getSelectionHandle } from "engine/utils/selectionhandle";
import {
  Box3,
  BoxGeometry,
  Color,
  Group,
  Intersection,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Vector3,
} from "three";

import { getColliderGUI } from "./colliderui";
import { disposeMesh } from "engine/utils/dispose";
import Scene from "engine/scene";
import Augmented from "engine/abstract/augmented";
import { getDataChangeCommand, getUndoChanges } from "./data";
import { EditorContext } from "./types";
import { getScriptingFolderGUI } from "./scriptingfolderui";
import { Store } from "./store";
import { Lens } from "./lens/lens";
import { AbstractLens } from "./lens/abstract";
import { DataWrapperLens, DataLensView } from "./lens/datawrapperlens";
import { PathLens } from "./lens/pathlens";
import { Preset } from "./preset";
import { hasOwn } from "engine/utils/js";
import { getTransformUI } from "./transformui";
import { ParamsParser } from "../params/parser";
import emitter from "engine/events/emitter";

const COMMANDS = {
  SHOW_PROMPT: "SHOW_PROMPT",
  UPDATE_UI: "UPDATE_UI",
  WORLD_UPLOAD_FILE: "WORLD_UPLOAD_FILE",
  WORLD_UPDATE_DATA: "WORLD_UPDATE_DATA",
  ATTACH_TRANSFORM_CONTROLS: "ATTACH_TRANSFORM_CONTROLS",
  DETACH_TRANSFORM_CONTROLS: "DETACH_TRANSFORM_CONTROLS",
  CREATE_PREFAB: "CREATE_PREFAB",
  DETACH_PREFAB_INSTANCE: "DETACH_PREFA_INSTANCE",
  REQUEST_SELECTION: "REQUEST_SELECTION",
} as const;

export type UIEditorState = {
  unfolds: Record<string, boolean>;
};

const topLevelFolders = {
  script: true,
  collider: true,
};

export class Component3DEditor<
  T extends Component3D<any> = Component3D
> extends Augmented {
  //
  get IS_UI_EDITOR() {
    return true;
  }

  private _visible = true;

  componentId: string = null;

  protected _editMeshes = new Set<Object3D>();

  masks = {
    highlightMesh: 1,
    selectionBox: 1,
  };

  COMMANDS = COMMANDS;

  _studioEditor: EngineEdit = null;

  _selMesh: Mesh = null;

  defaultColliderUI = true;

  _additionalGUIs = {};

  _guiStore = new Store<UIEditorState>({
    unfolds: {},
  });

  constructor(protected _component: T) {
    super();

    this.componentId = _component.data.id;
  }

  get component() {
    return this._component;
  }

  set component(val: T) {
    //
    debugger;
  }

  get visible() {
    return this._visible;
  }

  private _layers = new WeakMap<Object3D, number>();

  protected _setVisible(val: boolean) {
    //
    if (val === this._visible) return;

    this._visible = val;

    this.component.visible = val;

    this._editMeshes.forEach((mesh) => {
      if (!val) {
        this._layers.set(mesh, mesh.layers.mask);
        mesh.layers.disableAll();
      } else {
        mesh.layers.set(this._layers.get(mesh));
      }
    });

    this.onVisibleChanged(val);
  }

  onVisibleChanged(val: boolean) {}

  get guiStore() {
    return this._guiStore;
  }

  get guiState() {
    return this._guiStore.getState();
  }

  getDataContext(): any {
    //
    return this.component;
  }

  setGuiState = (state: UIEditorState) => {
    //
    this._guiStore.update(state);
  };

  foldSection(path) {
    //
    this.toggleSection(path, false);
  }

  expandSection(path) {
    //
    this.toggleSection(path, true);
  }

  toggleSection = (path: string, val?: boolean) => {
    //
    let prefix = topLevelFolders[path] ? "/" : "/gui/";

    let key = prefix + path;

    let unfolds = this.guiState.unfolds;

    val ??= !unfolds[key];

    if (val === unfolds[key]) return;

    this.setGuiState({
      unfolds: {
        ...unfolds,
        [key]: val,
      },
    });
  };

  updateUI() {
    //
    this.emit(COMMANDS.UPDATE_UI);
  }

  async showPrompt(opts: {
    message: string;
    onSubmit: (text: string) => unknown;
  }): Promise<string> {
    //
    return new Promise((resolve, reject) => {
      //
      this.emit(COMMANDS.SHOW_PROMPT, {
        opts,
        resolve,
        reject,
      });
    });
  }

  async uploadFile(opts: {
    file: Blob | string;
    id: string;
    mimeType: string;
    isUnique?: boolean;
    overwrite?: boolean;
  }): Promise<{ url: string; mimeType: string }> {
    //
    return new Promise((resolve, reject) => {
      Emitter.emit(COMMANDS.WORLD_UPLOAD_FILE, {
        opts,
        resolve,
        reject,
      });
    });
  }

  attachTransfomControls(
    object: Object3D,
    opts: {
      callbacks?: {
        onDragStart?: () => void;
        onDragEnd?: () => void;
        onDrag?: () => void;
      };
      translate?: boolean;
      rotate?: boolean;
      scale?: boolean;
    }
  ) {
    //
    this.emit(COMMANDS.ATTACH_TRANSFORM_CONTROLS, {
      object,
      opts,
    });
  }

  detachTransformControls(object: Object3D) {
    //
    this.emit(COMMANDS.DETACH_TRANSFORM_CONTROLS, {
      object,
    });
  }

  createPrefab() {
    //
    this.emit(COMMANDS.CREATE_PREFAB, {
      component: this.component.data,
    });
  }

  detachPrefabInstance() {
    //
    this.emit(COMMANDS.DETACH_PREFAB_INSTANCE, {
      componentId: this.component.data.id,
    });
  }

  static requestSelection(componentId: string) {
    //
    Emitter.emit(COMMANDS.REQUEST_SELECTION, {
      componentId,
    });
  }

  getDataChanges(changes: Partial<T["data"]>) {
    //
    const undo = getUndoChanges(changes, this.component.data);

    return {
      id: this.component.data.id,
      changes,
      undo,
    };
  }

  dispatchDataChange(changes: Partial<T["data"]>) {
    // apply changes to the component.data
    const update = this.getDataChanges(changes);

    Emitter.emit(COMMANDS.WORLD_UPDATE_DATA, { updates: [update] });
  }

  dispatchDataChangeMulti(
    updates: Array<{ id: string; changes: object; undo: object }>
  ) {
    // apply changes to the component.data
    Emitter.emit(COMMANDS.WORLD_UPDATE_DATA, { updates });
  }

  get data(): T["data"] {
    //
    return this.component._dataWrapper._proxy;
  }

  protected createDefaultSelectionMesh() {
    const geometry = new BoxGeometry(1, 1, 1);

    geometry.translate(0, 0.5, 0);

    const mesh = new Mesh(
      geometry,
      new MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
    );

    this.component.add(mesh);

    return mesh;
  }

  getDetailMeshes(): Mesh[] {
    //
    return null;
  }

  onDetailMeshClicked(mesh: Mesh, intersect: Intersection<Mesh>) {}

  onDetailMeshMouseEnter(mesh: Mesh, intersect: Intersection<Mesh>) {}

  onDetailMeshMouseLeave(mesh: Mesh) {}

  get isFocusable() {
    return this.getSelectionMesh() != null;
  }

  getSelectionMesh() {
    return this.component.getCollisionMesh();
  }

  selectionBox: any = null;

  protected createSelectionBox(opts: {
    color: string;
    opacity?: number;
    dashed?: boolean;
    transparent?: boolean;
    dashScale?: number;
    gapSize?: number;
  }) {
    //
    const mesh = this.getSelectionMesh();

    if (mesh == null) return;

    let outline = getSelectionHandle(
      mesh,
      new Color(opts.color),
      2,
      opts.opacity,
      opts.dashed,
      opts.transparent,
      opts.dashScale,
      opts.gapSize
    );

    outline.name = "selectionBox";

    outline.matrixAutoUpdate = false;

    outline.matrixWorldAutoUpdate = false;

    outline.matrixWorld = mesh.matrixWorld;

    // outline.scale.copy(mesh.scale)

    Scene.add(outline);

    return outline;
  }

  private _isSelected = false;

  get isSelected() {
    //
    return this._isSelected;
  }

  getComponentsOptions(filter: string | ((c: Component3D) => boolean)) {
    //
    if (typeof filter === "string") {
      // strings with @ are tag filters
      if (filter.startsWith("@")) {
        //
        const tag = filter.slice(1);

        return this.component.container.byTag(tag).map((c) => ({
          id: c.data.id,
          name: c.data.name || c.data.id,
        }));
        //
      } else {
        //
        return this.component.container.byType(filter).map((c) => ({
          id: c.data.id,
          name: c.data.name || c.data.id,
        }));
      }
    }

    const res = [];

    this.component.container.forEach((c) => {
      if (c.userData.opts.transient) {
        return;
      }
      //
      if (filter(c)) {
        res.push({
          id: c.data.id,
          name: c.data.name || c.data.id,
        });
      }
    });

    return res;
  }

  /**
   * @internal
   */
  _setSelected(val: boolean) {
    //
    if (this.component.wasDisposed) return;

    this._isSelected = val;

    this.onSelectedChanged(val);
  }

  onSelectedChanged(isSelected: boolean) {}

  showSelected(isSelected: boolean) {
    //

    if (this.wasDisposed) return;

    if (this.selectionBox == null) {
      this.selectionBox = this.createSelectionBox({
        color: "#c0c0c0",
        dashed: true,
        opacity: 0.2 * 1.75,
        transparent: true,
        dashScale: 0.75,
        gapSize: 1.5,
      });
    }

    if (this.selectionBox == null) return;

    // if box is dashed, update the line distances
    if (this.selectionBox?.dashed == true) {
      this.selectionBox?.computeLineDistances();
    }

    this.selectionBox.visible = isSelected;

    this._editMeshes.add(this.selectionBox);

    // console.log( this.selectionBox.visible )
  }

  highlightMesh: Mesh = null;

  toggleHighlighted(val: boolean) {
    //
    if (this.component.wasDisposed) return;

    if (this.highlightMesh == null) {
      //

      this.highlightMesh = this.createSelectionBox({
        color: "#c0c0c0",
        opacity: 0.125 * 1.75,
        dashed: true,
        transparent: true,
        dashScale: 0.75,
        gapSize: 1.5,
      });

      if (this.highlightMesh == null) return;
    }

    if (this.highlightMesh == null) return;
    // @ts-ignore
    if (this.highlightMesh.dashed == true) {
      // @ts-ignore
      this.highlightMesh.computeLineDistances();
    }

    this.highlightMesh.visible = val;

    this._editMeshes.add(this.highlightMesh);
  }

  // gap real time sizing
  computeLineDistances() {
    if (
      this.selectionBox?.visible == true &&
      this.selectionBox?.dashed == true
    ) {
      this.selectionBox.computeLineDistances();
    }

    if (
      this.highlightMesh?.visible == true &&
      // @ts-ignore
      this.highlightMesh?.dashed == true
    ) {
      // @ts-ignore
      this.highlightMesh.computeLineDistances();
    }
  }

  uis = {
    collider: null,
    script: null,
  };

  protected getScriptGUI(context: EditorContext) {
    //
    if (this.data.type === "script") return null;

    return getScriptingFolderGUI(this);
  }

  protected getColliderGUI() {
    //
    if (this.component.getCollisionMesh() == null) return null;

    if (this.uis.collider == null) {
      this.uis.collider = getColliderGUI(this);
    }

    return this.uis.collider;
  }

  getGUI() {
    return null;
  }

  /**
   * Called by UI layer to get the GUI config for this component.
   * @internal
   */
  _onGUI(context: EditorContext) {
    //
    const gui = this.getGUI();

    if (gui == null) return null;

    const config: any = {
      type: "group",
      children: {
        gui,
      },
    };

    const script = this.getScriptGUI(context);

    if (script) {
      config.children.script = script;
    }

    if (this.defaultColliderUI) {
      const collider = this.getColliderGUI();

      if (collider) {
        config.children.collider = collider;
      }
    }

    Object.assign(config.children, this._additionalGUIs);

    return config;
  }

  setAdditionalGUIs(guis: Record<string, any>) {
    this._additionalGUIs = guis;

    this.updateUI();
  }

  init() {}

  // _playerHalo: Group = null;

  _onInit() {
    //
    this.init();

    this._setVisible(!this.component.data._hidden);

    this.component._dataWrapper.onChange(() => {
      //
      this._setVisible(!this.component.data._hidden);
    });

    /*
        if (this.data.script?._isPlayer) {
            //
            const mesh = this.getSelectionMesh();

            if (!mesh.geometry.boundingBox) {
                //
                mesh.geometry.computeBoundingBox();
            }

            this._playerHalo = SpawnSelectionMesh.create(
                mesh.geometry.boundingBox
            );

            this._playerHalo.matrixAutoUpdate = false;

            this._playerHalo.matrixWorldAutoUpdate = false;

            this._playerHalo.matrix = mesh.matrixWorld;

            this._playerHalo.updateMatrixWorld(true);

            this.component.onMatrixChanged(() => {
                //
                this._playerHalo.updateMatrixWorld(true);
            });

            //
            //child.matrixAutoUpdate = false;
            //child.matrixWorldAutoUpdate = false;
            //child.matrixWorld = mesh.matrixWorld;
            // });

            // outline.scale.copy(mesh.scale)

            Scene.add(this._playerHalo);
        }*/
  }

  dispose() {}

  wasDisposed = false;

  _onDispose() {
    if (this.wasDisposed) return;

    this.wasDisposed = true;

    if (this.selectionBox) {
      this.selectionBox.parent?.remove(this.selectionBox);

      disposeMesh(this.selectionBox);

      this.selectionBox = null;
    }

    if (this.highlightMesh) {
      this.highlightMesh.parent?.remove(this.highlightMesh);

      disposeMesh(this.highlightMesh);

      this.highlightMesh = null;
    }

    if (this._selMesh) {
      this._selMesh.parent?.remove(this._selMesh);

      disposeMesh(this._selMesh);

      this._selMesh = null;
    }

    /*
        if (this._playerHalo) {
            Scene.remove(this._playerHalo);

            SpawnSelectionMesh.dispose(this._playerHalo);

            this._playerHalo = null;
        }
        */

    this.dispose();
  }

  private static _lensCache: WeakMap<any, AbstractLens> = new WeakMap();

  getLens(source: any) {
    //
    if (source instanceof AbstractLens) return source;

    if (Component3DEditor._lensCache.has(source)) {
      return Component3DEditor._lensCache.get(source);
    }

    const lens = this._createLens(source);

    Component3DEditor._lensCache.set(source, lens);

    return lens;
  }

  private _createLens(source: any): AbstractLens {
    //
    if (typeof source === "function") {
      //
      return new Lens({
        get: source,
      });
    }

    if (source?.$$IS_VIEW) {
      //
      return new DataWrapperLens(
        this._component._dataWrapper,
        source.path,
        source.view
      );
    }

    if (Array.isArray(source)) {
      //
      let object = source[0];

      let path: string[];

      if (typeof object === "string") {
        //
        object = this.data;

        path = source.slice();
      } else {
        //
        path = source.slice(1);
      }

      if (object == this.data) {
        //
        return new DataWrapperLens(this._component._dataWrapper, path);
        //
      } else {
        //
        let object = source[0];

        return new PathLens({
          data: object === this ? this._component._dataWrapper : null,
          object,
          path: source.slice(1),
        });
      }
    }

    if (typeof source?.get === "function") {
      //
      return new Lens(source);
      //
    } else {
      //
      throw new Error("Invalid lens source");
    }
  }

  private _presetCache: WeakMap<any, Preset> = new WeakMap();

  getPreset(data: any) {
    //
    let preset = this._presetCache.get(data);

    if (preset) return preset;

    preset = new Preset({
      data,
      wrapper: this._component._dataWrapper,
    });

    this._presetCache.set(data, preset);

    return preset;
  }

  view(path: string | string[], view?: DataLensView) {
    //
    return this._createLens({
      $$IS_VIEW: true,
      view,
      path: Array.isArray(path) ? path : path.split("."),
    });
  }

  // when a component is removed from the scene and we perfom an undo
  // the create lens no longer works because the component is no longer in the scene
  // We must recreate the lens to point to the new component
  reviveLens(lens: AbstractLens) {
    //
    if (lens instanceof DataWrapperLens) {
      //
      lens.wrapper = this._component._dataWrapper;
      //
    } else if (lens instanceof PathLens && lens.object == this) {
      //
      lens.data = this._component._dataWrapper;

      if (lens.componentId == this.component.data.id) {
        //
        lens.object = this;
      }
    }

    return lens;
  }

  _pendingUpdate: Record<string, any> = {};

  _pendingUpdatesUndo: Record<string, any> = {};

  _addPendingChange(key, value, oldVal) {
    //
    this._pendingUpdate[key] = value;

    if (!hasOwn(this._pendingUpdatesUndo, key)) {
      //
      this._pendingUpdatesUndo[key] = oldVal;
    }
  }

  _commitUpdates() {
    //
    const hasChanges = Object.keys(this._pendingUpdate).length > 0;

    if (this.wasDisposed || !hasChanges) return;

    const changes = this._pendingUpdate;

    const undo = this._pendingUpdatesUndo;

    this._pendingUpdate = {};

    this.dispatchDataChangeMulti([
      {
        id: this.data.id,
        changes,
        undo,
      },
    ]);
  }

  static _DEFAULT_OPTS = {
    position: {},
    rotation: {},
    scale: {},
  };

  protected static _toTrUI(opts: any) {
    //
    if (!opts) return null;

    if (opts === true) {
      //
      return this._DEFAULT_OPTS;
    }

    const res: any = {};

    if (opts.position) {
      //
      res.position = {};
    }
    if (opts.rotation) {
      //
      res.rotation = {};
    }

    if (opts.scale) {
      //
      res.scale = {};
    }

    return res;
  }

  protected getParamsGui(trOpts?: any) {
    //
    trOpts ??= Component3DEditor._toTrUI(this.component.info.transform);

    const transform = trOpts ? getTransformUI(this, trOpts) : null;

    const params = ParamsParser.getInstanceGui(this.component);

    return {
      type: "group",
      children: {
        transform,
        params,
      },
    };
  }
}
