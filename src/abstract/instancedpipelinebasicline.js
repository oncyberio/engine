import Emitter from "engine/events/emitter";

import Events from "engine/events/events";

import InstancedMeshWrapper from "./instancemeshwrapper.js";

import PipeLineBasicLine from "./pipelinebasiclines.js";

export default class InstancedPipelineBasicLine extends PipeLineBasicLine {
  constructor(geometry, material, opts) {
    super(geometry, material, opts);

    this.baseGeometry = geometry;

    if (opts.type != null) {
      this.instanceType = opts.type;
    } else {
      debugger;
    }

    this.matrixAutoUpdate = false;

    this.matrixWorldAutoUpdate = false;

    this.frustumCulled = false;

    this.count = -1;

    this.instances = [];

    this.addEvents();
  }

  setScaleRatio(val) {
    this._scaleRatio = val;
  }

  sort(camera, force = false) {
    // console.log(this.instanceType , this.instances.length)

    if (this.instances.length == 0) {
      this.geometry._maxInstanceCount = 0;

      this.visible = false;

      return;
    }

    // copy data from the copy buffer

    if (this.geometry.copyBuffer) {
      if (
        this.geometry.bufferVersion != this.geometry.copyBuffer.bufferVersion
      ) {
        this.geometry.updateCopyBuffers(this.geometry.copyBuffer);
      }

      this.geometry._maxInstanceCount =
        this.geometry.copyBuffer._maxInstanceCount;
      this.geometry.projMatrix = this.geometry.copyBuffer.projMatrix;
      this.geometry._wMatrix = this.geometry.copyBuffer._wMatrix;

      // compute closest distance per geometry
      this.geometry.computeClosestDistance(camera);

      if (this.geometry._lods) {
        let i = 1;

        while (i < this.geometry._lods.length) {
          this.geometry._lods[i]._maxInstanceCount =
            this.geometry.copyBuffer._lods[i]._maxInstanceCount;

          this.geometry._lods[i]._closestDistance =
            this.geometry.copyBuffer._lods[i]._closestDistance;

          // this.geometry._lods[i].boundingSphere.copy( this.geometry.copyBuffer._lods[i].boundingSphere)

          i++;
        }
      }
    } else {
      this.geometry.sort(this.instances, camera);

      this.geometry.computeClosestDistance(camera);
    }

    // console.log( this.geometry._closestDistance )

    if (this.geometry._maxInstanceCount == 0) {
      this.visible = false;

      if (this.geometry._lods) {
        let i = 0;

        while (i < this.geometry._lods.length) {
          this.visible =
            this.visible || this.geometry._lods[i]._maxInstanceCount > 0;

          i++;
        }
      }
    } else {
      this.visible = true;

      this._closestDistance = this.geometry._closestDistance;
    }

    // console.log( this._closestDistance)
  }

  add(opts) {
    this.count++;

    if (this._scaleRatio != null) {
      opts.scaleRatio = this._scaleRatio;
    }
    const instance = new InstancedMeshWrapper(
      this,
      this.geometry,
      this.count,
      opts
    );

    this.instances.push(instance);

    return instance;
  }

  remove(instance) {
    const index = this.instances.indexOf(instance);

    if (index == -1) {
      return;
    }

    this.instances.splice(index, 1);
  }

  _update(scene, camera, force = false) {
    let parent = this;

    while (parent.parent !== null) {
      parent = parent.parent;
    }

    if (parent != null && parent == scene) {
      this.sort(camera, force);
    }
  }

  addEvents() {
    if (this.updateEvent == null) {
      this.updateEvent = this._update.bind(this);

      Emitter.on(Events.PRE_RENDER, this.updateEvent);
    }
  }

  dispose() {
    this.removeEvents();

    super.dispose();
  }

  removeEvents() {
    if (this.updateEvent != null) {
      Emitter.off(Events.PRE_RENDER, this.updateEvent);

      this.updateEvent = null;
    }
  }

  reset() {
    this.dispose();
  }
}
