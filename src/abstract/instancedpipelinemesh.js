import Emitter from "engine/events/emitter";

import Events from "engine/events/events";

import InstancedMeshWrapper from "./instancemeshwrapper.js";

import PipelineMesh from "./pipelinemesh.js";

import Camera from "engine/camera";

export default class InstancedPipelineMesh extends PipelineMesh {
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

    this.instancesCount = 0;

    this.usedIndexes = new BufferedInt32Array(100);

    this.nonUsedIndexes = new BufferedInt32Array(100);

    this.wrapperFlagUpdates = [];

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

    if (this.geometry.useUniqueFrustumTestFunction != null) {
      let frustum = camera && camera.frustum ? camera.frustum : Camera.frustum;

      let res = this.geometry.useUniqueFrustumTestFunction(frustum);

      if (res == false) {
        this.geometry._maxInstanceCount = 0;

        this.visible = false;

        return;
      }
    }

    // let uniqueFrutumTestResult = false

    // if( this.useUniqueFrustumTestFunction != null ){

    //     uniqueFrutumTestResult = this.useUniqueFrustumTestFunction( frustum )
    // }

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
      if (this.geometry.useSorting == true) {
        this.geometry.sort(this.instances, camera);

        this.geometry.computeClosestDistance(camera);
      } else {
        if (this.instancesCount != this.instances.length) {
          this.geometry.assemble(this.instances);

          this.instancesCount = this.instances.length;

          //this.geometry.updateCopyBuffers( this.instances )
        }
        // this.geometry.
      }
    }

    if (this.geometry.useSorting == false) {
      let h = 0;

      while (h < this.wrapperFlagUpdates.length) {
        this.geometry.updateNonSorted(this.wrapperFlagUpdates[h]);

        h++;
      }

      this.wrapperFlagUpdates = [];

      this.geometry.rangeNonSorted(this.instances);
    }

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
    if (this.geometry == null) {
      return;
    }

    this.count++;

    if (this._scaleRatio != null) {
      opts.scaleRatio = this._scaleRatio;
    }

    let index = this.count;

    if (this.geometry.useSorting == false) {
      if (this.nonUsedIndexes.length > 0) {
        index = this.nonUsedIndexes.shift();
      }

      this.usedIndexes.push(index);
    }

    const instance = new InstancedMeshWrapper(this, this.geometry, index, opts);

    this.instances.push(instance);

    if (this.geometry.useSorting == false) {
      this.wrapperFlagUpdates.push(instance);
    }

    return instance;
  }

  wrapperUpdate(wrapper) {
    this.wrapperFlagUpdates.push(wrapper);
  }

  remove(instance) {
    if (this.geometry == null) {
      return;
    }

    let index = -1;

    if (this.geometry.useSorting == false) {
      const usedIndex = this.usedIndexes.indexOf(instance.id);

      this.usedIndexes.splice(usedIndex, 1);

      this.nonUsedIndexes.push(instance.id);
    } else {
      index = this.instances.indexOf(instance);

      if (index == -1) {
        return;
      }
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

class BufferedInt32Array {
  growCapacity = 100;
  constructor(initialCapacity = 100) {
    this.buffer = new Int32Array(initialCapacity);
    this.length = 0;

    return new Proxy(this, {
      get(target, prop) {
        if (typeof prop === "string") {
          const index = parseInt(prop, 10);
          if (
            typeof index === "number" &&
            index >= 0 &&
            index < target.length
          ) {
            return target.buffer[index];
          }
        }
        return target[prop];
      },
      set(target, prop, value) {
        if (typeof prop === "string") {
          const index = parseInt(prop, 10);
          if (typeof index === "number" && index >= 0) {
            if (index >= target.buffer.length) {
              target.resize(index + 1);
            }
            target.buffer[index] = value;
            target.length = Math.max(target.length, index + 1);
            return true;
          }
        }
        target[prop] = value;
        return true;
      },
    });
  }

  resize(minCapacity) {
    if (minCapacity > this.buffer.length) {
      const newCapacity =
        Math.ceil(minCapacity / this.growCapacity) * this.growCapacity;

      const newBuffer = new Int32Array(newCapacity);
      newBuffer.set(this.buffer);
      this.buffer = newBuffer;
    }
  }

  push(...items) {
    const newLength = this.length + items.length;
    this.resize(newLength);
    this.buffer.set(items, this.length);
    this.length = newLength;
    return this.length;
  }

  toArray() {
    return this.buffer.slice(0, this.length);
  }

  splice(start, deleteCount, ...items) {
    start = Math.max(0, start < 0 ? this.length + start : start);
    deleteCount = Math.min(Math.max(0, deleteCount), this.length - start);

    const deleted = this.buffer.slice(start, start + deleteCount);
    const newLength = this.length - deleteCount + items.length;

    if (items.length > deleteCount) {
      this.resize(newLength);
      this.buffer.copyWithin(
        start + items.length,
        start + deleteCount,
        this.length
      );
    }

    this.buffer.set(items, start);

    if (deleteCount > items.length) {
      this.buffer.copyWithin(
        start + items.length,
        start + deleteCount,
        this.length
      );
    }

    this.length = newLength;
    return deleted;
  }

  shift() {
    if (this.length === 0) return undefined;
    const firstElement = this.buffer[0];
    this.splice(0, 1);
    return firstElement;
  }

  indexOf(searchElement, fromIndex = 0) {
    fromIndex = Math.max(
      0,
      fromIndex < 0 ? this.length + fromIndex : fromIndex
    );
    for (let i = fromIndex; i < this.length; i++) {
      if (this.buffer[i] === searchElement) {
        return i;
      }
    }
    return -1;
  }

  // Debug method to show current buffer capacity
  getCapacity() {
    return this.buffer.length;
  }
}
