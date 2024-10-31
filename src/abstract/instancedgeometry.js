import {
  InstancedBufferGeometry,
  InstancedBufferAttribute,
  BufferAttribute,
  Vector3,
  Sphere,
  DynamicDrawUsage,
  Matrix4,
  Quaternion,
  // Mesh,
  // SphereGeometry,
  // MeshBasicMaterial
} from "three";

import Camera from "engine/camera";

let temp1 = new Vector3();

const AWAY = 1000000;

import Renderer from "engine/renderer";

const START_LEVEL = 1;

const MULTIPLE = 25;

const DISTANCES = [0, 150, 250];

const tempQuat = new Quaternion();

const tempv3 = new Vector3();

const tempScale = new Vector3(1, 1, 1);

const tempPos = new Vector3();

import { radixSort } from "three/addons/utils/SortUtils.js";

export default class GeometryInstancer extends InstancedBufferGeometry {
  constructor(geometry, opts = {}) {
    super();

    this.opts = opts;

    this.projMatrix = new Matrix4();

    this.isLOD = geometry.lod != undefined;

    if (this.isLOD == true) {
      this._lods = [];
    }

    this.isStatic = opts.isStatic != null ? opts.isStatic : false;

    if (opts.boundingSphere == null) {
      geometry.computeBoundingSphere();
    }

    if (opts.name) {
      this.name = opts.name;
    }

    if (opts.vrmName) {
      this.vrmName = opts.vrmName;
    }

    this.sphere = opts.boundingSphere
      ? opts.boundingSphere
      : geometry.boundingSphere;

    this.transparencySorting = opts.transparencySorting == true;

    this.useUniqueFrustumTestFunction = null;

    this.tempCenter = this.sphere.center;

    this.tempRadius = this.sphere.radius;

    this.useNormal = opts.useNormal ? opts.useNormal : false;

    this.useGeometryColor = opts.useGeometryColor
      ? opts.useGeometryColor
      : false;

    this.useInstancedColor = opts.color != null ? opts.color : false;

    this.useFrustumCulling =
      opts.useFrustumCulling != null ? opts.useFrustumCulling : true;

    this.useSorting = opts.useSorting != null ? opts.useSorting : true;

    this.useSkin = opts.useSkin ? opts.useSkin : false;

    this.vrmScale = opts.vrmScale ? opts.vrmScale : false;

    this.sorter = opts.sorter ? opts.sorter : null;

    this.max = opts.max ?? START_LEVEL;

    this.previousMax = this.max;

    this.tempSphere = new Sphere();

    this.INSTANCED = true;

    this.copyBuffer = opts.copyBuffer != null ? opts.copyBuffer : null;

    this.scaleRatio = opts.scaleRatio != null ? opts.scaleRatio : 1;

    this.initializeBaseGeometry(geometry);

    this.opts = opts;

    this._closestDistance = AWAY;

    this._closestPosition = new Vector3();

    this.baseGeometry = geometry;

    this.computeBoundingSphere();

    this.originalSphere = new Sphere().copy(this.boundingSphere);

    this._closestInstance = new Vector3();
    this._closestRotation = new Quaternion();
    this._closestScale = new Vector3();

    this._latestCamera = null;

    this._wMatrix = new Matrix4();
  }

  oldLength = 0;

  setUniqueFrustumTest(value) {
    if (value != null) {
      this.useFrustumCulling = true;
    }

    this.useUniqueFrustumTestFunction = value;
  }

  sort(wrappers, camera = null, forceView = false) {
    this.grow(wrappers.length);

    this.oldLength = wrappers.length;

    let closestDistance = AWAY;
    this.visibleWrappers = [];
    let frustum = camera && camera.frustum ? camera.frustum : Camera.frustum;
    let camPosition = camera ? camera.position : Camera.current.position;

    if (this.sorter != null) {
      this.sorter.sort(this, wrappers, frustum, camPosition);
      return;
    }

    this._maxInstanceCount = 0;
    if (this.isLOD) {
      this._lods.forEach((lod) => (lod._maxInstanceCount = 0));
    }
    if (this.vrmScale == true) {
      tempQuat.identity();
    }

    let uniqueFrutumTestResult = false;

    if (this.useUniqueFrustumTestFunction != null) {
      uniqueFrutumTestResult = this.useUniqueFrustumTestFunction(frustum);
    }
    this.radixminZ = Infinity;
    this.radixmaxZ = -Infinity;

    let x = 0;

    while (x < wrappers.length) {
      let contains = false;

      const wrapper = wrappers[x];

      if (wrapper.updateFromSource != null) {
        wrapper.updateFromSource();
      }

      if (this.useFrustumCulling == false || uniqueFrutumTestResult == true) {
        contains = true;
      } else if (wrapper.visible == false || wrapper.opacity == 0) {
        x++;
        continue;
      }

      if (
        Renderer.shadowMap.autoUpdate ||
        forceView ||
        this.useFrustumCulling == false
      ) {
        if (wrapper.dynamicShadow == true) {
          x++;
          continue;
        }
        contains = true;
      } else {
        temp1.copy(wrapper.position);
        let maxScale = Math.max(
          wrapper.scale.x * this.scaleRatio,
          wrapper.scale.y,
          wrapper.scale.z
        );
        maxScale = this.vrmScale
          ? Math.max(wrapper._scale.x, wrapper._scale.y, wrapper._scale.z)
          : maxScale;
        if (wrapper.dynamicShadow) maxScale *= 2;

        if (wrapper.customFrustumTest != null) {
          contains = wrapper.customFrustumTest(frustum);
        } else {
          this.sphere.radius = this.tempRadius * maxScale;
          this.tempSphere.copy(this.sphere);
          this.tempSphere.center.add(temp1);
          contains = frustum.intersectsSphere(this.tempSphere);
        }
      }

      if (contains) {
        wrapper._distance = temp1.distanceTo(camPosition);
        if (wrapper._distance < closestDistance) {
          this.boundingSphere.center
            .copy(this.originalSphere.center)
            .add(wrapper.position);
          tempPos.copy(wrapper.position);
          if (this.vrmScale != true) {
            tempQuat.set(
              wrapper.rotation[0],
              wrapper.rotation[1],
              wrapper.rotation[2],
              wrapper.rotation[3]
            );
          }
        }

        closestDistance = Math.min(closestDistance, wrapper._distance);
        this.visibleWrappers.push(wrapper);

        if (this.transparencySorting == true) {
          this.prepareForRadixSorting(wrapper, true);
        } else {
          var scope = this;

          if (this.isLOD && Renderer.shadowMap.autoUpdate == false) {
            scope =
              this._lods[
                Math.min(
                  this._lods.length - 1,
                  this.findInterval(wrapper._distance, DISTANCES)
                )
              ];
          }

          this.updateAttribute(scope, wrapper, scope._maxInstanceCount);

          scope._maxInstanceCount++;
        }
      }

      x++;
    }

    // wait for all the instances distance to be done for transparent sorting..

    if (this.transparencySorting && this.visibleWrappers.length > 0) {
      if (this.visibleWrappers.length > 1) {
        if (this._radixOptions == null || this.previousMax != this.max) {
          this._radixOptions = {
            get: (el) => el.z,
            aux: new Array(this.max),
            reversed: true,
          };
        }

        this.previousMax = this.max;

        this.computeRadix(this.visibleWrappers);

        radixSort(this.visibleWrappers, this._radixOptions);
      }

      var count = 0;

      while (count < this.visibleWrappers.length) {
        const wrapper = this.visibleWrappers[count];

        var scope = this;

        if (this.isLOD && Renderer.shadowMap.autoUpdate == false) {
          scope =
            this._lods[
              Math.min(
                this._lods.length - 1,
                this.findInterval(wrapper._distance, DISTANCES)
              )
            ];
        }

        this.updateAttribute(scope, wrapper, scope._maxInstanceCount);

        scope._maxInstanceCount++;

        count++;
      }
    }

    let h = 0;

    let l = this.isLOD ? this._lods.length : 1;

    while (h < l) {
      const scope = this.isLOD ? this._lods[h] : this;

      if (scope._maxInstanceCount > 0) {
        scope.attributes.offset._updateRange.count =
          scope._maxInstanceCount * scope.attributes.offset.itemSize;

        scope.attributes.offset.needsUpdate = true;

        for (const item in this.items) {
          scope.attributes[item]._updateRange.count =
            scope._maxInstanceCount * scope.attributes[item].itemSize;

          scope.attributes[item].needsUpdate = true;
        }
      }
      h++;
    }

    if (this.copyBuffer == null) {
      if (camera.projScreenMatrix != null) {
        this.projMatrix.copy(camera.projScreenMatrix);
      } else {
        this.projMatrix.multiplyMatrices(
          camera.projectionMatrix,
          camera.matrixWorldInverse
        );
      }

      this._wMatrix.compose(tempPos, tempQuat, tempScale);
    }
  }

  updateNonSorted(instance) {
    this.updateAttribute(this, instance, instance.id);
  }

  rangeNonSorted(instances) {
    this._maxInstanceCount = instances.length;

    if (this._maxInstanceCount > 0) {
      this.attributes.offset._updateRange.count =
        this._maxInstanceCount * this.attributes.offset.itemSize;

      this.attributes.offset.needsUpdate = true;

      for (const item in this.items) {
        this.attributes[item]._updateRange.count =
          this._maxInstanceCount * this.attributes[item].itemSize;

        this.attributes[item].needsUpdate = true;
      }
    }
  }

  updateAttribute(scope, wrapper, c) {
    const base3 = c * 3;
    const base4 = c * 4;

    scope.attributes.offset.array[base3] = wrapper.position.x;
    scope.attributes.offset.array[base3 + 1] = wrapper.position.y;
    scope.attributes.offset.array[base3 + 2] = wrapper.position.z;

    if (this.vrmScale == true) {
      // vrm scale is calculatedf already in the wrapper
      const s = wrapper.vrmScale;
      scope.attributes.scale.array[base3] = s;
      scope.attributes.scale.array[base3 + 1] = s;
      scope.attributes.scale.array[base3 + 2] = s;
    } else {
      scope.attributes.scale.array[base3] = wrapper.scale.x * this.scaleRatio;

      scope.attributes.scale.array[base3 + 1] = wrapper.scale.y;
      scope.attributes.scale.array[base3 + 2] = wrapper.scale.z;
    }

    if (this.opts.rotationY == true) {
      scope.attributes.rotationY.array[c] = wrapper.rotationY;
    }

    if (this.opts.rotation == true) {
      scope.attributes.rotation.array[base4] = wrapper.rotation[0];
      scope.attributes.rotation.array[base4 + 1] = wrapper.rotation[1];
      scope.attributes.rotation.array[base4 + 2] = wrapper.rotation[2];
      scope.attributes.rotation.array[base4 + 3] = wrapper.rotation[3];
    }

    if (this.useInstancedColor) {
      scope.attributes.icolor.array[base3] = wrapper.color.r;
      scope.attributes.icolor.array[base3 + 1] = wrapper.color.g;
      scope.attributes.icolor.array[base3 + 2] = wrapper.color.b;
    }

    if (this.opts.atlas) {
      scope.attributes.atlas.array[base4] = wrapper.atlas.x;
      scope.attributes.atlas.array[base4 + 1] = wrapper.atlas.y;
      scope.attributes.atlas.array[base4 + 2] = wrapper.atlas.z;
      scope.attributes.atlas.array[base4 + 3] = wrapper.atlas.w;
    }

    if (this.opts.animations) {
      scope.attributes.animations.array[base4] = wrapper.animations[0];
      scope.attributes.animations.array[base4 + 1] = wrapper.animations[1];
      scope.attributes.animations.array[base4 + 2] = wrapper.animations[2];
      scope.attributes.animations.array[base4 + 3] = wrapper.animations[3];
    }

    if (this.opts.randomID) {
      scope.attributes.randomID.array[c] = wrapper.randomID;
    }

    if (this.opts.opacity) {
      scope.attributes.aOpacity.array[c] = wrapper.opacity;
    }

    // set plugin attributes
    if (this.opts.plugins && this.opts.plugins.length > 0) {
      // transform into while loop instead

      let g = 0;

      while (g < this.opts.plugins.length) {
        const plugin = this.opts.plugins[g];

        if (plugin.attributes) {
          var attributes = Object.keys(plugin.attributes);

          let i = 0;

          while (i < attributes.length) {
            const item = attributes[i];

            const pItem = plugin.attributes[item];

            if (pItem.length == 1) {
              scope.attributes[item].array[c] = wrapper[item];
            } else {
              let m = 0;

              while (m < pItem.length) {
                scope.attributes[item].array[c * pItem.length + m] =
                  wrapper[item][m];

                m++;
              }
            }
            i++;
          }
        }

        g++;
      }
    }
  }

  computeClosestDistance(camera) {
    tempv3.copy(this.originalSphere.center);
    tempv3.applyMatrix4(this._wMatrix);
    tempv3.applyMatrix4(this.projMatrix);

    this._closestDistance = tempv3.z;
  }

  closestMultiple(number) {
    // Calculate the remainder when dividing the number by 50
    const remainder = number % MULTIPLE;

    // Calculate the difference between the number and the next multiple of 50
    const difference = MULTIPLE - remainder;

    // Return the closest higher multiple of 50
    return number + difference;
  }

  updateCopyBuffers() {
    if (
      this.copyBuffer != null &&
      this.bufferVersion != this.copyBuffer.bufferVersion
    ) {
      this.attributes.offset = this.copyBuffer.attributes.offset;

      for (const item in this.items) {
        this.attributes[item] = this.copyBuffer.attributes[item];
      }

      this.bufferVersion = this.copyBuffer.bufferVersion;
    }
  }

  grow(count) {
    if (this.copyBuffer != null) {
      // console.log('nop')
    } else {
      if (count > this.max) {
        this.max = this.closestMultiple(count);

        let i = 0;

        let l = this.isLOD ? this._lods.length : 1;

        while (i < l) {
          const scope = this.isLOD ? this._lods[i] : this;

          for (const attributeName in scope.attributes) {
            var attribute = scope.attributes[attributeName];

            if (attribute instanceof InstancedBufferAttribute) {
              const newArray = new attribute.array.constructor(
                this.max * attribute.itemSize
              );

              newArray.set(attribute.array);

              const newAttribute = new InstancedBufferAttribute(
                newArray,
                attribute.itemSize,
                attribute.normalized
              );

              newAttribute.setUsage(DynamicDrawUsage);

              scope.attributes[attributeName] = newAttribute;

              scope.attributes[attributeName].needsUpdate = true;

              attribute = null;
            }
          }

          i++;
        }

        if (this.bufferVersion == null) {
          this.bufferVersion = 0;
        }

        this.bufferVersion++;
      }
    }
  }

  assemble(instances) {
    let count = instances.length;

    if (count > this.max) {
      this.grow(count);

      let i = 0;

      while (i < count) {
        const wrapper = instances[i];

        this.updateAttribute(this, wrapper, wrapper.id);

        i++;
      }
    }
  }

  initializeBaseGeometry(geometry) {
    if (this.opts.boundingSphere == null) {
      geometry.computeBoundingSphere();
    }

    this.sphere = this.opts.boundingSphere
      ? this.opts.boundingSphere
      : geometry.boundingSphere;

    this.tempRadius = this.sphere.radius;

    let i = 0;

    const length = this.isLOD ? geometry.lod.length + 1 : 1;

    while (i < length) {
      let scope = this.isLOD
        ? i == 0
          ? this
          : new InstancedBufferGeometry()
        : this;

      let geo = this.isLOD
        ? i == 0
          ? geometry
          : geometry.lod[i - 1]
        : geometry;

      if (geo.index) {
        scope.setIndex(new BufferAttribute(geo.index.array, 1));
      }

      if (geo.attributes.position) {
        scope.setAttribute(
          "position",
          new BufferAttribute(geo.attributes.position.array, 3)
        );
      }

      if (geometry.attributes.color && this.useGeometryColor) {
        scope.setAttribute(
          "color",
          new BufferAttribute(geometry.attributes.color.array, 3)
        );
      }

      if (geo.attributes.normal && this.useNormal) {
        scope.setAttribute(
          "normal",
          new BufferAttribute(geo.attributes.normal.array, 3)
        );
      }

      if (geo.attributes.uv) {
        scope.setAttribute(
          "uv",
          new BufferAttribute(geo.attributes.uv.array, 2)
        );
      }

      if (geo.attributes.uv1) {
        scope.setAttribute(
          "uv1",
          new BufferAttribute(geo.attributes.uv1.array, 2)
        );
      }

      if (geo.customAttributes && geo.customAttributes.length > 0) {
        geo.customAttributes.forEach((attribute) => {
          scope.setAttribute(
            attribute.name,
            new BufferAttribute(
              attribute.content.array,
              attribute.content.itemSize
            )
          );
        });
      }

      if (geo.attributes.skinWeight && this.useSkin == true) {
        scope.attributes.skinWeight = geo.attributes.skinWeight;
      }

      if (geo.attributes.skinIndex && this.useSkin == true) {
        scope.attributes.skinIndex = geo.attributes.skinIndex;
      }

      scope.items = {};

      if (this.useInstancedColor) {
        scope.items.icolor = {
          name: "icolor",
          array: [],
          length: 3,
        };
      }

      if (this.opts.plugins && this.opts.plugins.length > 0) {
        for (const plugin of this.opts.plugins) {
          for (const item in plugin.attributes) {
            scope.items[item] = plugin.attributes[item];
            scope.items[item].array = [];
          }
        }
      }

      if (this.opts.scale) {
        scope.items.scale = {
          name: "scale",
          array: [],
          length: 3,
        };
      }

      if (this.opts.rotation == true) {
        scope.items.rotation = {
          name: "rotation",
          array: [],
          length: 4,
        };
      }

      if (this.opts.rotationY == true) {
        scope.items.rotationY = {
          name: "rotationY",
          array: [],
          length: 1,
        };
      }

      if (this.opts.atlas) {
        scope.items.atlas = {
          name: "atlas",
          length: 4,
        };

        scope.textureID = this.opts.textureID;
      }

      if (this.opts.opacity == true) {
        scope.items.aOpacity = {
          name: "aOpacity",
          length: 1,
        };
      }

      if (this.opts.animations) {
        scope.items.animations = {
          name: "animations",
          length: 4,
          // type: Int16Array
        };
      }

      if (this.opts.randomID) {
        scope.items.randomID = {
          name: "randomID",
          length: 1,
        };
      }

      if (scope.copyBuffer != null) {
        scope.attributes.offset = scope.copyBuffer.attributes.offset;

        for (const item in scope.items) {
          scope.attributes[item] = scope.copyBuffer.attributes[item];
        }
      } else {
        scope.setAttribute(
          "offset",
          new InstancedBufferAttribute(
            new Float32Array(new Array(3 * this.max)),
            3,
            false,
            1
          )
        );

        scope.attributes.offset.setUsage(DynamicDrawUsage);

        for (const item in scope.items) {
          var type = scope.items[item].type;

          if (type == null) {
            type = Float32Array;
          }

          scope.setAttribute(
            item,
            new InstancedBufferAttribute(
              new type(new Array(scope.items[item].length * this.max)),
              scope.items[item].length,
              false,
              1
            )
          );

          scope.attributes[item].setUsage(DynamicDrawUsage);
        }
      }

      if (this.isLOD) {
        this._lods.push(scope);
      }

      i++;
    }
  }

  radixmaxZ = -Infinity;
  radixminZ = Infinity;

  prepareForRadixSorting(wrapper) {
    const z = wrapper._distance;
    if (z > this.radixmaxZ) this.radixmaxZ = z;
    if (z < this.radixminZ) this.radixminZ = z;
  }

  computeRadix(wrappers) {
    const depthDelta = this.radixmaxZ - this.radixminZ;

    const factor = (2 ** 32 - 1) / depthDelta; // UINT32_MAX / z range

    let i = 0;
    while (i < wrappers.length) {
      const wrapper = wrappers[i];

      wrapper.z = wrapper._distance;
      wrapper.z -= this.radixminZ;
      wrapper.z *= factor;

      i++;
    }
  }

  findInterval(num, arr) {
    for (let i = 1; i < arr.length; i++) {
      if (num < arr[i]) {
        return i - 1;
      }
    }
    return arr.length - 1;
  }
}
