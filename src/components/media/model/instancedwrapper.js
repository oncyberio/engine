import scene from "engine/scene";
import {
  Object3D,
  BufferGeometry,
  BufferAttribute,
  Mesh,
  MeshBasicMaterial,
} from "three";

import { mergeBufferGeometries } from "engine/loaders/utils";

import { DEBUG_PHYSICS } from "engine/constants";

import Pipeline from "engine/pipeline";

export default class InstancedModelWrapper extends Object3D {
  constructor(opts) {
    super();

    const { instancedMeshes, collisionNode, useTransparency } = opts;

    this.opts = opts;

    this.useTransparency = useTransparency;

    this.collisionNode = collisionNode;

    this.setInstances(instancedMeshes);
  }

  addItem = (data) => {
    let i = 0;

    let first = null;

    while (i < this.instances.length) {
      //
      const instance = this.instances[i].add(data);

      if (i == 0) {
        first = instance;

        first.copyInstances = [];
      } else {
        first.copyInstances.push(instance);
      }

      i++;
    }
    try {
      first.buildCollisionMesh = this.buildCollisionMesh.bind(
        null,
        this.instances
      );
    } catch (e) {
      debugger;
    }

    first.useTransparency = this.useTransparency;

    return first;
  };

  removeItem = (wrapper) => {
    let i = 0;

    const instances = wrapper.copyInstances;

    while (i < instances.length) {
      //
      const instance = instances[i];

      instance.mesh.remove(instance);

      i++;
    }

    wrapper.mesh.remove(wrapper);
  };

  _geometry = null;

  _material = null;

  buildCollisionMesh = (instances) => {
    if (this._geometry == null) {
      if (this.collisionNode != null) {
        this._geometry = this.collisionNode.geometry;
      } else {
        let geometries = [];

        instances.forEach((instance) => {
          const buff = new BufferGeometry();

          if (instance.geometry.attributes.position) {
            buff.setAttribute(
              "position",
              new BufferAttribute(
                instance.geometry.attributes.position.array,
                3
              )
            );
          }

          if (instance.geometry.attributes.normal) {
            buff.setAttribute(
              "normal",
              new BufferAttribute(instance.geometry.attributes.normal.array, 3)
            );
          }

          if (instance.geometry.index) {
            buff.setIndex(
              new BufferAttribute(instance.geometry.index.array, 1)
            );
          }

          geometries.push(buff);
        });

        const mergedGeometry = mergeBufferGeometries(geometries, false, {
          forceList: ["position"],
        });

        this._geometry = mergedGeometry;
      }

      this._material = new MeshBasicMaterial({
        color: 0xff0000,
        wireframe: true,
        side: 2,
      });
    }

    const mesh = new Mesh(this._geometry, this._material);

    mesh.visible = true;

    mesh.updateMatrixWorld();

    if (DEBUG_PHYSICS) {
      //scene.add( mesh )
    }

    this._collisionMesh = mesh;

    return mesh;
  };

  setInstances(instances) {
    this.instances = instances;

    let i = 0;

    while (i < instances.length) {
      this.add(instances[i]);

      i++;
    }
  }

  dispose() {
    let i = 0;

    while (i < this.instances.length) {
      const instance = this.instances[i];

      instance.dispose();

      i++;
    }

    // let i = 0

    // while( i < wrapper.copyInstances.length ){

    //     wrapper.copyInstances[i].mesh.remove(  wrapper.copyInstances[i] )

    //     i++
    // }

    // wrapper.mesh.remove( wrapper )
  }
}
