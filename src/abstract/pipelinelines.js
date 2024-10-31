// @ts-check

import EventEmitter from "engine/events/_eventemitter";

import Emitter from "engine/events/emitter";

import Events from "engine/events/events";

import { DEFAULT_PIPELINE_OPTIONS, DEFAULT_STATE } from "./constants";

import { Line2 } from "three/examples/jsm/lines/Line2.js";

import { LineMaterial2 } from "engine/utils/lines/linematerial2.js";

import { Matrix4 } from "three";

let defaultOcclusionMaterial = new LineMaterial2({ color: 0x000000 });

let defaultMirrorMaterial = new LineMaterial2({ color: 0x00ff00 });

let defaultMaterialLight = new LineMaterial2({ color: 0x0000ff });

let state = Object.assign({}, DEFAULT_STATE);

export default class PipeLineMesh extends Line2 {
  constructor(geometry, material, rule = {}) {
    let pipelineOptions = Object.assign({}, DEFAULT_PIPELINE_OPTIONS);

    pipelineOptions = Object.assign(pipelineOptions, rule);

    super(geometry, material);

    this.isPipeLineMesh = true;

    this.useLighting = false;

    this._material = material;

    this.pipeLineSwitch = false;

    this.pipelineOptions = pipelineOptions;

    this.emitter = new EventEmitter();

    // =====+> DIFFUSE MATERIALS

    // DIFFUSE

    const diffuseMaterial = material;

    // OCCLUSION

    var occlusionMaterial =
      this.pipelineOptions.occlusionMaterial ||
      diffuseMaterial.occlusionMaterial;

    if (occlusionMaterial) {
      if (occlusionMaterial != diffuseMaterial) {
        if (occlusionMaterial.defines == null) {
          occlusionMaterial.defines = {};
        }

        if (diffuseMaterial.defines != null) {
          occlusionMaterial.defines = JSON.parse(
            JSON.stringify(occlusionMaterial.defines)
          );

          occlusionMaterial.defines = Object.assign(
            occlusionMaterial.defines,
            diffuseMaterial.defines
          );
        }

        occlusionMaterial.defines["OCCLUSION"] = "";
      }
    } else {
      occlusionMaterial = diffuseMaterial;
    }

    // MIRROR

    var mirrorMaterial =
      this.pipelineOptions.mirrorMaterial || diffuseMaterial.mirrorMaterial;

    if (mirrorMaterial) {
      if (mirrorMaterial != diffuseMaterial) {
        mirrorMaterial.defines = Object.assign({}, diffuseMaterial.defines);

        mirrorMaterial.defines["MIRROR"] = "";
      }
    } else {
      mirrorMaterial = diffuseMaterial;
    }

    // RECAP

    this.diffuseMaterials = {
      material: diffuseMaterial,

      occlusionMaterial: occlusionMaterial,

      mirrorMaterial: mirrorMaterial,
    };

    // <+======

    // =====+> LIGHTING MATERIALS

    // LIGHTING

    const lightingMaterial =
      this.pipelineOptions.lightingMaterial || diffuseMaterial;

    // IF DIFFERENT FROM DIFFUSE MATERIAL

    if (lightingMaterial != diffuseMaterial) {
      // GOT USE OF LIGHTING CAUSE IT GOT A DIFFERENT MATERIAL AS LIGHTINGMATERIAL

      this.useLighting = true;

      var lightingOcclusionMaterial =
        this.pipelineOptions.lightingOcclusionMaterial ||
        lightingMaterial.occlusionMaterial ||
        this.pipelineOptions.occlusionMaterial;

      // LIGHTING OCCLUSION

      if (lightingOcclusionMaterial) {
        if (lightingOcclusionMaterial != lightingMaterial) {
          if (lightingOcclusionMaterial.defines == null) {
            lightingOcclusionMaterial.defines = {};
          }

          if (lightingMaterial.defines != null) {
            lightingOcclusionMaterial.defines = JSON.parse(
              JSON.stringify(lightingOcclusionMaterial.defines)
            );

            lightingOcclusionMaterial.defines = Object.assign(
              lightingOcclusionMaterial.defines,
              lightingMaterial.defines
            );
          }

          lightingOcclusionMaterial.defines["OCCLUSION"] = "";
        }
      } else {
        lightingOcclusionMaterial = lightingMaterial;
      }

      // LIGHTING MIRROR

      var lightingMirrorMaterial =
        this.pipelineOptions.lightingMirrorMaterial ||
        lightingMaterial.mirrorMaterial;

      if (lightingMirrorMaterial) {
        if (lightingMirrorMaterial != lightingMaterial) {
          lightingMirrorMaterial.defines = Object.assign(
            {},
            lightingMaterial.defines
          );

          lightingMirrorMaterial.defines["MIRROR"] = "";
        }
      } else {
        lightingMirrorMaterial = lightingMaterial;
      }

      // RECAP

      this.lightingMaterials = {
        material: lightingMaterial,

        occlusionMaterial: lightingOcclusionMaterial,

        mirrorMaterial: lightingMirrorMaterial,
      };
    }

    //

    this._addEvents();

    this.material = diffuseMaterial;

    this._mirrorPreviousVisibility = null;

    this._diffusePreviousVisibility = null;

    this._occlusionPreviousVisibility = null;

    this.currentMode = this.diffuseMaterials;

    if (this.useLighting && state.lighting == true) {
      this._onLighting(state.lighting);
    }
  }

  overrideOcclusionMaterial(val) {
    this.diffuseMaterials.occlusionMaterial = val;

    if (this.lightingMaterials) {
      this.lightingMaterials.occlusionMaterial = val;
    }
  }

  _prevMatrix = new Matrix4();

  updateMatrixWorld(force) {
    super.updateMatrixWorld(force);

    if (
      this._hasMatrixListeners &&
      this.matrixWorld.equals(this._prevMatrix) === false
    ) {
      this._prevMatrix.copy(this.matrixWorld);

      this.emitter.emit(Events.MATRIX_CHANGED, this);
    }
  }

  _hasMatrixListeners = false;
  _matrixListeners = new Set();

  onMatrixChanged(cb) {
    this.emitter.on(Events.MATRIX_CHANGED, cb);

    this._hasMatrixListeners = true;
  }

  offMatrixChanged(cb) {
    this.emitter.off(Events.MATRIX_CHANGED, cb);

    this._hasMatrixListeners =
      this.emitter.listenerCount(Events.MATRIX_CHANGED) > 0;
  }

  set material(val) {
    this._material = val;

    if (this.pipeLineSwitch == false) {
      if (this.currentMode) {
        this.currentMode.material = val;

        if (val) {
          // this.currentMode.occlusionMaterial = val.occlusionMaterial  ? val.occlusionMaterial  : val
          // this.currentMode.mirrorMaterial    = val.mirrorMaterial     ? val.mirrorMaterial     : val
        }
      }
    }
  }

  get material() {
    return this._material;
  }

  set diffuseMaterial(val) {
    this.diffuseMaterials.material = val;

    this.material = val;
  }

  get diffuseMaterial() {
    return this.diffuseMaterials.material;
  }

  set mirrorMaterial(val) {
    this.diffuseMaterials.mirrorMaterial = val;
  }

  get mirrorMaterial() {
    return this.diffuseMaterials.mirrorMaterial;
  }

  set occlusionMaterial(val) {
    this.diffuseMaterials.occlusionMaterial = val;
  }

  get occlusionMaterial() {
    return this.diffuseMaterials.occlusionMaterial;
  }

  clone() {
    return this;
  }

  _onOcclusion(val) {
    this.pipeLineSwitch = val;

    if (
      this.geometry.isInstancedBufferGeometry == true &&
      this.geometry._maxInstanceCount == 0
    ) {
      return;
    }

    // if( this.visible == false ){

    //     return
    // }

    if (this.pipelineOptions.visibleOnOcclusion == false) {
      if (val == true) {
        this._occlusionPreviousVisibility = this.visible;

        this.visible = false;
      } else {
        this.visible = this._occlusionPreviousVisibility || this.visible;
      }
    }

    // if should not visible on diffuse

    if (this.pipelineOptions.visibleOnDiffuse == false) {
      // on diffuse pas

      if (val == true) {
        this._diffusePreviousVisibility = this.visible;

        this.visible =
          this._diffusePreviousVisibility == true ? true : this.visible;
      } else {
        this._diffusePreviousVisibility = this.visible;

        this.visible = false;
      }
    }

    this.material = val
      ? this.currentMode.occlusionMaterial
        ? this.currentMode.occlusionMaterial
        : defaultOcclusionMaterial
      : this.currentMode.material;

    if (val == true && this.pipelineOptions.overrideOcclusionMaterial != null) {
      this.material = this.pipelineOptions.overrideOcclusionMaterial;
    }

    state.occlusion = val;
  }

  _onMirror(val) {
    this.pipeLineSwitch = val;

    if (
      this.geometry.isInstancedBufferGeometry == true &&
      this.geometry._maxInstanceCount == 0
    ) {
      return;
    }

    // if( this.visible == false ){

    //     return
    // }

    if (this.pipelineOptions.visibleOnMirror == false) {
      if (val == true) {
        this._mirrorPreviousVisibility = this.visible;

        this.visible = false;
      } else {
        this.visible = this._mirrorPreviousVisibility;
      }
    }

    if (this.pipelineOptions.visibleOnMirror == true) {
      if (val == true) {
        this._mirrorPreviousVisibility = this.visible;

        this.visible = true;
      } else {
        this.visible =
          this._mirrorPreviousVisibility != null
            ? this._mirrorPreviousVisibility
            : this.visible;

        this._mirrorPreviousVisibility = null;
      }
    }

    this.material = val
      ? this.currentMode.mirrorMaterial
        ? this.currentMode.mirrorMaterial
        : defaultMirrorMaterial
      : this.currentMode.material;

    state.mirror = val;
  }

  _onLighting(val) {
    this.currentMode = val ? this.lightingMaterials : this.diffuseMaterials;

    state.lighting = val;

    // console.log( state.mirror )
    // console.log( state.occlusion )

    this._onMirror(state.mirror);

    this._onOcclusion(state.occlusion);
  }

  _addEvents() {
    if (this.occlusionEvent == null) {
      this.occlusionEvent = this._onOcclusion.bind(this);

      Emitter.on(Events.OCCLUSION, this.occlusionEvent);
    }

    if (this.mirrorEvent == null) {
      this.mirrorEvent = this._onMirror.bind(this);

      Emitter.on(Events.MIRROR, this.mirrorEvent);
    }

    if (this.useLighting && this.lightingEvent == null) {
      this.lightingEvent = this._onLighting.bind(this);

      Emitter.on(Events.LIGHTING, this.lightingEvent);
    }
  }

  _removeEvents() {
    if (this.occlusionEvent) {
      Emitter.off(Events.OCCLUSION, this.occlusionEvent);
    }

    if (this.occlusionEvent) {
      Emitter.off(Events.MIRROR, this.mirrorEvent);
    }

    if (this.lightingEvent) {
      Emitter.off(Events.LIGHTING, this.lightingEvent);
    }
  }
  destroy() {
    this.emitter.removeAllListeners();

    this._removeEvents();
  }

  dispose() {
    this.destroy();
  }

  raycast(raycaster, intersects) {
    const currentLineWidth = this.material.linewidth;

    this.material.linewidth = Math.max(
      this.pipelineOptions.raycastLineWidth,
      currentLineWidth
    );

    super.raycast(raycaster, intersects);

    this.material.linewidth = currentLineWidth;
  }
}
