// @ts-check

import { Box3, Mesh } from "three";
import InstancedMeshWrapper from "engine/abstract/instancemeshwrapper";
import { Component3D, ComponentOpts } from "engine/abstract/component3D";
import { XYZ } from "../types";
import { KitbashComponentData } from "./kitbashdata";
export type { KitbashComponentData } from "./kitbashdata";

// const scale =  [0.1 , 0.1 , 0.1]
const scale: XYZ = {
  x: 1,
  y: 1,
  z: 1,
};

function stripNumSuffix(str) {
  // replace all numbers at the end of the string with empty string
  return str.replace(/[_-]?\d+$/, "");
}

export interface KitBashElementOpts extends ComponentOpts {
  kitbashType: any;
}

/**
 * @public
 *
 * This component is used to display Kit Assets elements in the game
 *
 * See {@link KitbashComponentData} for the data schema used to create a kitbash component
 */
export class KitBashComponent extends Component3D<KitbashComponentData> {
  /**
   * @internal
   */
  instances: InstancedMeshWrapper[] = [];

  /**
   * @internal
   */
  collisionMesh: Mesh = null;

  /**
   * @internal
   */
  _kitbashType: any = null;

  /**
   * @internal
   */
  _title: string = null;

  /**
   * @internal
   */
  constructor(opts: KitBashElementOpts) {
    super(opts);

    this._kitbashType = opts.kitbashType;

    this._title = stripNumSuffix(this.data.kitType);

    this.rotation.order = "YXZ";
  }

  /**
   * @internal
   */
  async init() {
    const type = this._kitbashType;

    const { position, rotation, scale } = this.data;

    if (type.accessors == null) {
      type.accessors = [];
    }

    /** @type { InstancedMeshWrapper[] } */
    this.instances = [];

    type.baseItems.forEach((instanceWrapper) => {
      instanceWrapper.mesh.name = this.data.kitType;

      const instance = instanceWrapper.mesh.add({
        position: [position.x, position.y, position.z],

        rotation: [rotation.x, rotation.y, rotation.z],

        scale: { x: scale.x, y: scale.y, z: scale.z },

        plugins: instanceWrapper.plugins,

        data: this.data,
      });

      instance.attachTo(this);

      this.instances.push(instance);

      type.accessors.push(instance);

      // @ts-ignore
      this.opts.container.add(instanceWrapper.mesh);
    });

    //if it has collisions
    if (type.collision) {
      this.collisionMesh = type.collision.clone();

      this.collisionMesh.name = this.data.id;

      this.collisionMesh.rotation.order = "YXZ";

      this.add(this.collisionMesh);

      this.collisionMesh.visible = false;

      this.collisionMesh.userData.originalMesh = this;

      // this.setCollisionMesh(collisionmesh)
    }

    // @ts-ignore
    // this.selectionMesh = new Mesh(type.raycastGeometry, wf)

    // this.add(this.selectionMesh)

    this.update3D(true);
  }

  /**
   * @internal
   */
  onDataChange(_) {
    this.update3D();
  }

  setPlugins(item, val) {
    this.instances.forEach((instance) => {
      instance[item] = val;
    });
  }

  getPlugins(item) {
    if (this.instances[0][item] != null) {
      return this.instances[0][item];
    }
  }

  /**
   * @internal
   */
  getCollisionMesh() {
    return this.collisionMesh || null;
  }

  /**
   * @internal
   */
  syncWithTransform(isProgress = false) {
    //
    this.position.y = Math.max(this.position.y, 0);

    super.syncWithTransform();
  }

  /**
   * @internal
   */
  update3D() {
    const { position, rotation, scale } = this.data;

    this.rotation.set(rotation.x, rotation.y, rotation.z);

    this.position.set(position.x, position.y, position.z);

    this.scale.set(scale.x, scale.y, scale.z);

    // if ( this.collisionMesh ) {

    //     this.collisionMesh.position.set(position.x, position.y, position.z)

    //     // this.collisionMesh.rotation.y = rotation._y

    //     this.collisionMesh.rotation.set(
    //         rotation._x,

    //         rotation._y,

    //         rotation._z
    //     )

    //     this.collisionMesh.scale.set(scale.x, scale.y, scale.z)

    //     this.collisionMesh.updateMatrixWorld(true)
    // }

    // if (this.selectionBox) {

    //     this.selectionBox.position.copy(this.position)

    //     this.selectionBox.quaternion.copy(this.quaternion)
    // }
  }

  /**
   * @internal
   */
  _getBBoxImp(box: Box3) {
    //
    this.instances.forEach((instance) => {
      const ibox = instance.getBBox();

      box.union(ibox);
    });

    return box;
  }

  /**
   * @internal
   */
  dispose() {
    this._kitbashType.accessors = this._kitbashType.accessors.filter((it) => {
      //
      return this.instances.includes(it);
    });

    this.instances.forEach((instance) => {
      instance.mesh.remove(instance);
    });

    //disposeThreeResources(this);
  }
}
