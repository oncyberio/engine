// @ts-check

import { Component3D, DataChangeOpts } from "engine/abstract/component3D";
import {
  BoxGeometry,
  CylinderGeometry,
  Mesh,
  MeshLambertMaterial,
  SphereGeometry,
} from "three";
import PipeLineMesh from "engine/abstract/pipelinemesh";
import { disposeThreeResources } from "engine/utils/dispose";
import type { ColliderOpts, CollisionInfo } from "engine/@types/collider";
import { COLLIDER_TYPES } from "engine/components/physics/rapier/constants";
import { MeshComponentData, MeshGeometryData } from "./meshdata";
import { IS_EDIT_MODE } from "engine/constants";
import { $Param, Param } from "engine/space/params";

export type {
  MeshComponentData,
  BoxParamsData,
  CylinderParamsData,
  SphereParamsData,
  MeshGeometryData,
} from "./meshdata";

import DomeMaterial from "./material/dome";

/**
 * @public
 *
 * Mesh component, used to display simple meshes in the game (box, sphere, cylinder)
 *
 * See {@link MeshComponentData} for the data schema used to create a mesh component
 */
export class MeshComponent extends Component3D<MeshComponentData> {
  /**
   * This is the threejs mesh created from component data
   */
  mesh: Mesh = null;

  private _geometryNeedsUpdate = false;

  protected async init() {
    this.mesh = new PipeLineMesh(
      this.#createGeometry(),
      new MeshLambertMaterial({ color: this.data.color, side: 2 })
    );

    this.add(this.mesh);

    // this.selectionMesh = this.mesh

    this._update3D();

    this.updateRenderMode();
  }

  #geometry = null;

  #createBoxGeometry() {
    //
    const { width, height, depth } = this.data.geometry.boxParams ?? {};
    return new BoxGeometry(width || 1, height || 1, depth || 1);
  }

  #createSphereGeometry() {
    const { radius, widthSegments, heightSegments } =
      this.data.geometry.sphereParams;

    return new SphereGeometry(radius, widthSegments, heightSegments);
  }

  #createDomeGeometry() {
    const { radius, widthSegments, heightSegments } =
      this.data.geometry.sphereParams;

    return new SphereGeometry(
      radius,
      widthSegments,
      heightSegments,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.5
    );
  }

  #createCylinderGeometry() {
    const {
      radiusTop,
      radiusBottom,
      height,
      radialSegments,
      heightSegments,
      openEnded,
    } = this.data.geometry.cylinderParams;

    return new CylinderGeometry(
      radiusTop,
      radiusBottom,
      height,
      radialSegments,
      heightSegments,
      openEnded
    );
  }

  private _prevGeometryData = null;

  #createGeometry() {
    //
    if (this.#geometry) {
      //
      this.#geometry.dispose();
    }

    switch (this.data.geometry.type) {
      //
      case "box":
        this.#geometry = this.#createBoxGeometry();
        break;
      case "sphere":
        this.#geometry = this.#createSphereGeometry();
        break;
      case "cylinder":
        this.#geometry = this.#createCylinderGeometry();
        break;

      case "dome":
        this.#geometry = this.#createDomeGeometry();
        break;

      default:
        this.#geometry = this.#createBoxGeometry();
        console.error(`Unknown geometry type: ${this.data.geometry.type}`);
    }

    this._prevGeometryData = this.data.geometry;

    return this.#geometry;
  }

  private _update3D(isProgress = false) {
    //
    if (this._geometryNeedsUpdate && !isProgress) {
      this._geometryNeedsUpdate = false;

      this.mesh.geometry.dispose();

      this.mesh.geometry = this.#createGeometry();
    }

    const { color, opacity } = this.data;

    const material = this.mesh.material as MeshLambertMaterial;

    if (this.mesh.material instanceof DomeMaterial) {
    } else {
      material.color.set(color);

      material.opacity = opacity;

      const transparent = opacity < 1;

      if (transparent !== material.transparent) {
        material.transparent = transparent;

        material.needsUpdate = true;
      }
    }

    if (IS_EDIT_MODE) {
      this.mesh.visible = this.data.displayInEditor;
    } else {
      this.mesh.visible = this.data.display;
    }
  }

  getCollisionMesh() {
    return this.mesh;
  }

  /**
   * @internal
   */
  _getCollisionInfo(opts: ColliderOpts): CollisionInfo {
    let colliderType = opts.colliderType;

    if (this.data.geometry.type === "sphere") {
      colliderType = COLLIDER_TYPES.SPHERE;
    } else if (this.#geometry.type === "BoxGeometry") {
      colliderType = COLLIDER_TYPES.CUBE;
    } else if (this.#geometry.type === "CylinderGeometry") {
      let params = (this.#geometry as CylinderGeometry).parameters;

      if (params.radiusTop === params.radiusBottom) {
        colliderType = COLLIDER_TYPES.CYLINDER;
      }
    }

    return super._getCollisionInfo({
      ...opts,
      colliderType,
    });
  }

  /**
   * @internal
   */
  onDataChange(opts: DataChangeOpts<MeshComponentData>): void {
    //
    if (opts?.prev.geometry !== this.data.geometry) {
      this._geometryNeedsUpdate = true;
    }

    if (opts.prev?.renderMode != this.data.renderMode) {
      this.updateRenderMode();
    }

    this._update3D(opts?.isProgress);
  }

  updateRenderMode() {
    switch (this.data.renderMode) {
      case "wireframe":
        this.mesh.material = new MeshLambertMaterial({
          color: this.data.color,
          side: 2,
          wireframe: true,
        });

        this.mesh.renderOrder = 0;
        break;

      case "dome":
        this.mesh.material = new DomeMaterial();

        this.mesh.renderOrder = 10000000;

        break;

      case "default":
        this.mesh.material = new MeshLambertMaterial({
          color: this.data.color,
          side: 2,
        });
        this.mesh.renderOrder = 0;
        break;
    }
  }

  protected dispose() {
    disposeThreeResources(this.mesh);
  }

  /*****************************************************************
   *                      Public API
   *****************************************************************/

  /**
   * Geometry of the mesh. Defaults to a Box with a size of 1
   */
  @Param() geometryData: MeshGeometryData = $Param.Object(
    {
      type: "box",
      boxParams: {} as any,
      sphereParams: $Param.Object({
        radius: 1,
        widthSegments: 32,
        heightSegments: 32,
      }),
      cylinderParams: $Param.Object({
        radiusTop: 1,
        radiusBottom: 1,
        height: 1,
        radialSegments: 32,
        heightSegments: 1,
        openEnded: false,
      }),
    },
    { dataKey: "geometry" }
  );

  /**
   * Color of the mesh. Defaults to "#ff0000"
   */
  @Param() color = "#ff0000";

  /**
   * Opacity of the mesh. Defaults to 1
   */
  @Param() opacity = 1;
}
