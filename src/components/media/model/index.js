// @ts-check

import GLTF from "engine/gltf";

import {
  Object3D,
  Matrix4,
  Box3,
  Vector3,
  Sphere,
  AnimationClip,
  Skeleton,
  BufferGeometry,
  BufferAttribute,
  Quaternion,
} from "three";

import InstancedGeometry from "engine/abstract/instancedgeometry.js";

import InstancedModelWrapper from "./instancedwrapper.js";

import ClassicWrapper from "./classicwrapper.js";

import { disposeThreeResources } from "engine/utils/dispose";

import { COMPRESSED_SUPPORT, IS_DESKTOP } from "engine/constants";

import { DisposePipelinesMeshes } from "engine/utils/dispose.js";

import Pipeline from "engine/pipeline";

import { IS_EDIT_MODE } from "engine/constants";

const tempBox = new Box3();

const tempVec = new Vector3();

const tempMat4 = new Matrix4();

const v = new Vector3();

const s = new Vector3();

const q = new Quaternion();

export class ModelFactory {
  constructor() {
    this.classics = {};

    this.instances = {};

    this.GLTFManager = GLTF.getInstance();
  }

  async get(parent, data) {
    var url = data.url;

    if (COMPRESSED_SUPPORT) {
      if (
        COMPRESSED_SUPPORT &&
        data.optimized?.low_compressed != null &&
        data.optimized?.low_compressed != ""
      ) {
        url = data.optimized.low_compressed;
      }
    } else if (
      data.optimized?.low &&
      (__BUILD_TARGET__ == "node" || !IS_DESKTOP)
    ) {
      url = data.optimized?.low;
    }

    // needs to be overriden in the data directly, otherwise the destroy function
    // wont be able to find the correct url
    data.url = url;

    var pluginString = this.getPluginString(data);

    var namePlugin = url + pluginString;

    if (this.GLTFManager.isLock(namePlugin) == true) {
      await this.GLTFManager.loadOnce({ name: namePlugin, url: url });
    }

    if (
      this.instances[url + pluginString] == null &&
      this.classics[namePlugin] == null
    ) {
      const res = await this.GLTFManager.loadObject({
        name: namePlugin,
        url: url,
      });

      this.detectTransparency(res, data);

      pluginString = this.getPluginString(data);

      namePlugin = url + pluginString;

      // check again after detecting transparency just in case

      if (
        this.instances[url + pluginString] == null &&
        this.classics[namePlugin] == null
      ) {
        // const hasAnimationChannelEnabled = Object.keys(data.animations ?? {}).length > 0

        let isAnimated = __BUILD_TARGET__ == "web" && res.animations.length > 0; //&& Object.keys(data.animations ?? {}).length > 0;

        // live mode
        if (IS_EDIT_MODE == false) {
          isAnimated = isAnimated && data.enableAnimation == true;
        }

        if (isAnimated == true) {
          this.classics[namePlugin] = res;

          this.classics[namePlugin] = this.cloneGltf(
            res.scene,
            res.animations,
            true
          );

          this.classics[namePlugin].content = [];
        } else {
          const upd = this.updateToInstance(res, data);

          // upd is passing useTranspareny to the instance
          // this is the original check of transparency on a model

          this.instances[namePlugin] = new InstancedModelWrapper(upd);

          this.instances[namePlugin].count = 0;

          parent.add(this.instances[namePlugin]);
        }
      }

      this.GLTFManager.unlock(namePlugin);
    }

    if (this.instances[namePlugin] != null) {
      this.instances[namePlugin].count++;

      return this.instances[namePlugin].addItem(data);
    } else {
      const classic = this.classics[namePlugin];

      const clone = this.cloneGltf(classic.scene, classic.animations);

      this.upgradeObject(clone.scene, data);

      // data of transparency used is passed to the wrapper to let the component know if it has transparency

      const classicWrapper = new ClassicWrapper(clone, data);

      this.classics[namePlugin].content.push(classicWrapper);

      parent.add(classicWrapper);

      return classicWrapper;
    }
  }

  updateToInstance(res, data) {
    let gatherLODs = [];

    let i = 0;

    var meshes = [];

    res.scene.traverse((child) => {
      if (child.isMesh) {
        if (child.name.includes("LOD")) {
          const split = child.name.split("LOD")[1];
          // push the LODs in the array depending on the index of the lod 0X

          const index = parseInt(split);

          if (gatherLODs[index] == null) {
            gatherLODs[index] = child;
          }
        } else {
          meshes.push(child);
        }
      }
    });

    // then make sure that the array is not sparse

    gatherLODs = gatherLODs.filter((lod) => lod != null);

    // make sure that there is at least one mesh total in case theres only LOD in the glb..

    if (meshes.length == 0 && gatherLODs.length > 0) {
      gatherLODs[0].name = gatherLODs[0].name.replace("LOD", "");

      gatherLODs.splice(0, 1);
    }

    // flatten hierarchy

    this.flattenSceneHierarchy(res, data, gatherLODs);

    // remove LODS from the scene
    // since they are only a copy now

    i = 0;

    while (i < gatherLODs.length) {
      res.scene.remove(gatherLODs[i]);

      i++;
    }

    const sphere = this.computeBoundingSphere(res.scene);

    const instancedMeshes = [];

    i = 0;

    var copyBuffer = null;

    var collisionNode = null;

    while (i < res.scene.children.length) {
      const child = res.scene.children[i];

      if (child.name.includes("_collision")) {
        collisionNode = child;
      }

      i++;
    }

    if (collisionNode != null) {
      res.scene.remove(collisionNode);
    }

    i = 0;

    while (i < res.scene.children.length) {
      const o = res.scene.children[i];

      // add LOD if existing
      if (gatherLODs.length > 0) {
        o.geometry.lod = gatherLODs.map((lod) => lod.geometry);
      }

      const finalOpacityUsage =
        data.useTransparency == true ? true : o.material.transparent;

      if (o.geometry.attributes.normal == null) {
        o.geometry.computeVertexNormals();
      }

      var geometry = new InstancedGeometry(o.geometry, {
        rotation: true,

        scale: true,

        useGeometryColor: o.geometry.attributes.color != null,

        // we need to set it to true, in case the first buffer ( the copy buffer ) is non transparent, but the rest is..
        // so the other buffers will need the aOpacity attribute
        opacity: true,

        transparencySorting: finalOpacityUsage,

        copyBuffer: copyBuffer,

        boundingSphere: sphere,

        useNormal: true,

        name: o.name + "_geometry",
      });

      var mesh = Pipeline.get(o, geometry, o.material, {
        enableRealTimeShadow: data.enableRealTimeShadow,
        instance: true,
        renderMode: data.renderMode,
        skinning: false,
        useTransparency: finalOpacityUsage,
        plugins: [],
        envmapIntensity: data.envmapIntensity ? data.envmapIntensity : 1,
      });

      mesh.name = o.name;

      if (copyBuffer == null) {
        copyBuffer = mesh.geometry;
      }

      i++;

      instancedMeshes.push(mesh);
    }

    return {
      instancedMeshes,
      collisionNode,
      useTransparency: data.useTransparency,
    };
  }

  flattenSceneHierarchy(res, data, lods) {
    // remove LODS from the scene

    let i = 0;

    while (i < lods.length) {
      const lod = lods[i];

      lod.__previousParent = lod.parent;

      lod.__previousParent.remove(lod);

      i++;
    }

    // calculate bounding boxes without LODS

    tempBox.setFromObject(res.scene);

    tempBox.getCenter(tempVec);

    tempMat4.makeTranslation(-tempVec.x, -tempVec.y, -tempVec.z);

    // then put back the LODS in the scene

    i = 0;

    while (i < lods.length) {
      const lod = lods[i];

      lod.__previousParent.add(lod);

      i++;
    }

    const sc = new Object3D();

    const meshes = [];

    let geos = {};

    // check for similar geometries first in the scene..

    res.scene.traverse((child) => {
      if (child.isMesh) {
        if (geos[child.geometry.uuid] != null) {
          geos[child.geometry.uuid] = child.geometry;
        } else {
          this.desinterleave(child.geometry);

          const currentUUID = child.geometry.uuid;

          const newGeom = new BufferGeometry();

          newGeom.name = child.geometry.name;

          for (const property in child.geometry.attributes) {
            const attribute = child.geometry.attributes[property];

            const newAttribute = new BufferAttribute(
              new attribute.array.constructor(attribute.array),
              attribute.itemSize,
              attribute.normalized
            );

            newGeom.setAttribute(property, newAttribute);
          }

          // debugger

          if (child.geometry.index != null) {
            newGeom.setIndex(
              new BufferAttribute(child.geometry.index.array, 1)
            );
          }

          child.geometry = newGeom;

          geos[currentUUID] = newGeom;
        }
      }
    });

    // now is positive
    // res.scene.scale.x = -1

    res.scene.updateWorldMatrix(true, true);

    const usedGeos = {};
    const originalGeometries = {};

    // store original geometries

    res.scene.traverse((child) => {
      if (child.isMesh) {
        originalGeometries[child.geometry.uuid] = child.geometry.clone();
      }
    });

    res.scene.traverse((child) => {
      if (child.isMesh) {
        child.matrixWorld.decompose(v, q, s);

        // already seen geometry but not the same matrix world
        if (
          usedGeos[child.geometry.uuid] != null &&
          usedGeos[child.geometry.uuid].matrixWorld.equals(child.matrixWorld) ==
            false
        ) {
          // then clone original geometry first
          child.geometry = originalGeometries[child.geometry.uuid].clone();
        }

        child.geometry.applyMatrix4(child.matrixWorld);

        child.geometry.applyMatrix4(tempMat4);

        usedGeos[child.geometry.uuid] = {
          geometry: child.geometry,
          matrixWorld: child.matrixWorld,
        };

        child.position.set(0, 0, 0);

        child.rotation.set(0, 0, 0);

        child.quaternion.set(0, 0, 0, 1);

        child.scale.set(1, 1, 1);

        //   // revert the index array

        if (s.x * s.y * s.z < 0) {
          child.geometry.index.array.reverse();
        }

        meshes.push(child);
      }
    });

    sc.position.set(0, 0, 0);
    sc.rotation.set(0, 0, 0);
    sc.scale.set(1, 1, 1);

    sc.add(...meshes);

    res.scene = sc;
  }

  computeBoundingSphere(object) {
    let bbox = new Box3().setFromObject(object);

    const center = new Vector3();
    bbox.getCenter(center);

    let sphere = bbox.getBoundingSphere(new Sphere(center));

    return sphere;
  }

  desinterleave(geometry) {
    const attributes = geometry.attributes;

    for (const attributeName in attributes) {
      if (attributes.hasOwnProperty(attributeName)) {
        const attribute = attributes[attributeName];

        if (attribute.isInterleavedBufferAttribute) {
          attributes[attributeName] = attributes[attributeName].clone();
        }
      }
    }
  }

  cloneGltf(scene, animations, deepClone = false) {
    const clone = {
      animations: this.cloneAnimations(animations),
      scene: scene.clone(true),
    };

    const skinnedMeshes = {};

    scene.traverse((node) => {
      if (node.isSkinnedMesh) {
        skinnedMeshes[node.name] = node;
      }
    });

    const cloneBones = {};
    const cloneSkinnedMeshes = {};

    const clonedGeometry = {};
    const cloneMaterials = {};

    clone.scene.traverse((node) => {
      if (node.isBone) {
        cloneBones[node.name] = node;
      }

      if (node.isSkinnedMesh) {
        cloneSkinnedMeshes[node.name] = node;
      }
      // if( deepClone ) {

      //     if(node.geometry ){

      //         if( clonedGeometry[node.geometry.uuid] == null ) {

      //             node.geometry = node.geometry.clone()
      //         }
      //         else {
      //             node.geometry = clonedGeometry[node.geometry.uuid]
      //         }

      //     }

      //     if( node.material ){

      //         if( cloneMaterials[node.material.uuid] == null ){

      //             node.material = node.material.clone()
      //         }

      //         else {
      //             node.material = cloneMaterials[node.material.uuid]
      //         }
      //     }
      // }
    });

    for (let name in skinnedMeshes) {
      const skinnedMesh = skinnedMeshes[name];
      const skeleton = skinnedMesh.skeleton;
      const cloneSkinnedMesh = cloneSkinnedMeshes[name];

      const orderedCloneBones = [];

      for (let i = 0; i < skeleton.bones.length; ++i) {
        const cloneBone = cloneBones[skeleton.bones[i].name];
        orderedCloneBones.push(cloneBone);
      }

      cloneSkinnedMesh.bind(
        new Skeleton(orderedCloneBones, skeleton.boneInverses),
        cloneSkinnedMesh.matrixWorld
      );

      cloneSkinnedMesh.receiveShadow = true;

      cloneSkinnedMesh.castShadow = true;
    }

    return clone;
  }

  cloneAnimations(sourceAnimations) {
    const clonedAnimations = [];

    sourceAnimations.forEach((sourceClip) => {
      const clonedClip = AnimationClip.parse(
        JSON.parse(JSON.stringify(sourceClip.toJSON()))
      );
      clonedAnimations.push(clonedClip);
    });

    return clonedAnimations;
  }

  upgradeObject(object, data = {}) {
    const meshesToReplace = [];

    object.traverse((val) => {
      if (val.material) {
        meshesToReplace.push(val);
      }
    });

    const meshMap = new Map();

    const materialCache = {};

    let i = 0;

    while (i < meshesToReplace.length) {
      const torp = meshesToReplace[i];

      torp.material.transparent = true;

      if (torp.isMesh) {
        let newMesh;

        if (torp.skeleton !== undefined) {
          newMesh = Pipeline.get(torp, torp.geometry, torp.material, {
            enableRealTimeShadow: false,
            instance: false,
            renderMode: data.renderMode,
            skinning: true,
            plugins: [],
            useTransparency: data.useTransparency,
            envmapIntensity: data.envmapIntensity ? data.envmapIntensity : 1,
            visibleOnOcclusion: true,
            visibleOnMirror: false,
          });

          if (materialCache[torp.material.uuid] == null) {
            materialCache[torp.material.uuid] = newMesh;
          } else {
            // debugger;
          }

          // newMesh = new PipeLineSkinnedMesh(
          //     torp.geometry,
          //     torp.material,
          //     {
          //         occlusionMaterial: occlusionMaterial,
          //         visibleOnOcclusion: true,
          //         visibleOnMirror: false,
          //     }
          // );

          // Bind skeleton and matrices
          newMesh.bind(torp.skeleton, torp.matrixWorld);
          newMesh.skeleton = torp.skeleton;
          newMesh.bindMatrix.copy(torp.bindMatrix);
          newMesh.bindMatrixInverse.copy(torp.bindMatrixInverse);
        } else {
          newMesh = Pipeline.get(torp, torp.geometry, torp.material, {
            instance: false,
            renderMode: data.renderMode,
            useTransparency: data.useTransparency,
            plugins: [],
            envmapIntensity: data.envmapIntensity ? data.envmapIntensity : 1,
            visibleOnOcclusion: true,
          });
        }

        // Copy properties from the original mesh
        newMesh.position.copy(torp.position);
        newMesh.rotation.copy(torp.rotation);
        newMesh.scale.copy(torp.scale);
        newMesh.name = torp.name;
        newMesh.receiveShadow = true;

        // Store the new mesh and its parent relationship
        meshMap.set(newMesh, {
          parent: torp.parent,
          children: torp.children,
        });

        // Add the new mesh to its parent
        const parent = torp.parent;

        parent.add(newMesh);
        // Remove the original mesh from its parent
        parent.remove(torp);
      }

      i++;
    }

    // Clean up references and data from the original meshes
    meshMap.forEach((value, oldMesh) => {
      // Dispose or perform any necessary cleanup operations on the old mesh
      // For example: oldMesh.geometry.dispose(), oldMesh.material.dispose(), etc.

      // Reparent the children of the original mesh to the new mesh
      value.children.forEach((child) => {
        oldMesh.add(child);
      });
    });

    object.updateMatrixWorld();

    if (data.center === true) {
      //
      this.center(object);
    }
  }

  center(object) {
    let box = new Box3().setFromObject(object, true);

    let localSize = new Vector3();

    box.getSize(localSize);

    box.setFromObject(object);

    const center = new Vector3();

    box.getCenter(center);

    object.position.x -= center.x;
    object.position.y -= center.y;
    object.position.z -= center.z;
  }

  removeInstance(wrapper) {
    const url = wrapper?.opts?.url;

    const pluginString = this.getPluginString(wrapper?.opts);

    const namePlugin = url + pluginString;

    if (this.instances[namePlugin]) {
      this.instances[namePlugin].removeItem(wrapper);
    }

    if (this.classics[namePlugin]) {
      const index = this.classics[namePlugin].content.indexOf(wrapper);

      wrapper.parent.remove(wrapper);

      wrapper.stop();

      this.classics[namePlugin].content.splice(index, 1);

      if (this.classics[namePlugin].content.length == 0) {
        // dispose the events of the pipelinemeshes + the scene

        wrapper.dispose(true);

        disposeThreeResources(this.classics[namePlugin].scene);

        this.GLTFManager.freeRessource(namePlugin);

        this.classics[namePlugin] = null;
      } else {
        // dispose the events of the pipelinemeshes only
        wrapper.dispose();
      }
    }
  }

  dispose(wrapper) {
    const url = wrapper?.opts?.url;

    const pluginString = this.getPluginString(wrapper?.opts);

    const namePlugin = url + pluginString;

    if (this.instances[namePlugin]) {
      if (this.instances[namePlugin].parent) {
        this.instances[namePlugin].parent.remove(this.instances[namePlugin]);
      }

      this.instances[namePlugin].dispose();

      delete this.instances[namePlugin];
    }

    if (this.classics[namePlugin]) {
      let i = 0;

      while (i < this.classics[namePlugin].content.length) {
        const content = this.classics[namePlugin].content[i];

        if (content.parent) {
          content.parent.remove(content);
        }

        content.dispose();

        i++;
      }

      disposeThreeResources(this.classics[namePlugin].scene);

      delete this.classics[namePlugin];
    }
  }

  disposeAll() {
    for (const url in this.instances) {
      if (this.instances[url].parent) {
        this.instances[url].parent.remove(this.instances[url]);
      }

      let i = 0;

      while (i < this.instances[url].instances.length) {
        const mesh = this.instances[url].instances[i];

        DisposePipelinesMeshes(mesh);

        mesh.dispose();

        i++;
      }

      this.GLTFManager.freeAllRessources();
    }

    this.instances = {};

    for (const url in this.classics) {
      if (this.classics[url]) {
        let i = 0;

        while (i < this.classics[url].content.length) {
          const content = this.classics[url].content[i];

          if (content.parent) {
            content.parent.remove(content);
          }

          content.dispose();

          i++;
        }

        disposeThreeResources(this.classics[url].scene);

        delete this.classics[url];
      }
    }

    this.classics = {};

    this.GLTFManager = null;
  }

  isValid(data) {
    return true;
    if (this.GLTFManager.isValid(data.url) == false) {
      return false;
    }

    return true;
  }

  detectTransparency(res, data) {
    // never been set, so need to check if the scene has transparency

    if (data.useTransparency == null) {
      data.useTransparency = false;

      res.scene.traverse((child) => {
        if (
          child.isMesh &&
          child.name.includes("LOD") == false &&
          child.name.includes("collision") == false
        ) {
          if (child.material.transparent == true) {
            data.useTransparency = true;
          }
        }
      });
    }
  }

  getPluginString(opts) {
    var str = "";

    if (opts.plugins != null) {
      let i = 0;

      while (i < opts.plugins.length) {
        str += opts.plugins[i].name + ",";
        i++;
      }
    }

    if (opts.renderMode != null && opts.renderMode != "default") {
      str += opts.renderMode + ",";
    }

    if (IS_EDIT_MODE == false) {
      const hasAnimationChannelEnabled = opts.enableAnimation == true;

      if (hasAnimationChannelEnabled == true) {
        str += "animated" + hasAnimationChannelEnabled + ",";
      }
    }

    if (opts.enableRealTimeShadow == true) {
      str += "realTimeShadow" + opts.enableRealTimeShadow + ",";
    }

    str += "transparency" + opts.useTransparency + ",";

    return str;
  }
}
