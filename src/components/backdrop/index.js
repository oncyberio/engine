import { MeshBasicMaterial, SphereGeometry } from "three";

import PipeLineMesh from "engine/abstract/pipelinemesh";

import BackDropMaterial from "./material.js";

class BackDropFactory {
  constructor() {
    this.isInit = false;

    this._init = false;

    this._instances = [];
  }

  async get(data = {}) {
    const diffuseMaterial = new BackDropMaterial(data);

    const mesh = new PipeLineMesh(
      new SphereGeometry(50, 32, 32),

      diffuseMaterial,

      {
        lightingMaterial: diffuseMaterial,

        occlusionMaterial: new MeshBasicMaterial({ color: 0x000000 }),
      }
    );

    mesh.onBeforeRender = function (
      renderer,
      scene,
      camera,
      geometry,
      material,
      group
    ) {
      this.matrixWorld.copyPosition(camera.matrixWorld);
      //mesh.position.copy(camera.position)

      //console.log( camera.position )
    };

    console.log(mesh);

    mesh.name = "BACKGROUND";

    mesh.name = "backdrop";

    this._instances.push(mesh);

    return mesh;
  }

  disposeAll() {
    let i = 0;

    while (i < this._instances.length) {
      if (this._instances[i].parent) {
        this._instances[i].parent.remove(this._instances[i]);
      }

      this._instances[i].dispose();

      this._instances[i].geometry.dispose();

      this._instances[i] = null;
      i++;
    }

    this._instances = [];
  }
}

export default new BackDropFactory();
