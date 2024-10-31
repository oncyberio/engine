import { PlaneGeometry, SRGBColorSpace } from "three";

import * as THREE_CONSTANTS from "three/src/constants.js";

import Textures from "engine/textures";

import InstancedGeometry from "engine/abstract/instancedgeometry.js";

import InstancedPipelineMesh from "engine/abstract/instancedpipelinemesh.js";

import InstancedBasic from "engine/materials/instancedbasic";

import InstancedLambert from "engine/materials/instancedlambert";

import InstancedOcclusion from "engine/materials/instancedocclusion";

import InstancedShadow from "engine/materials/instancedshadow";

import { DisposePipelinesMeshes } from "engine/utils/dispose.js";

import InstanceOpacityPlugin from "engine/libraries/visuals/instanceopacity/index.js";

export class ImageFactory {
  constructor() {
    this.baseGeometry = new PlaneGeometry(1, 1);

    this.baseGeometry.computeBoundingSphere();

    /**
     * @type { Record<string, InstancedPipelineMesh> }
     */
    this.instances = {};

    this.wrappers = {};

    // globalThis.ImageFactory = this;
  }

  async get(parent, data) {
    const info = this.getInfos(data);

    if (Textures.isLock(info) == true) {
      console.log("well, texture is locked, so we wait for it to load...");
      await Textures.loadOnce({ name: info, url: info });
    }

    if (this.instances[info] == null) {
      var tex = Textures[info];
      if (tex == null) {
        tex = await Textures.loadOnce({
          name: info,
          url: info,
        });
      }

      if (tex == undefined) {
        debugger;
      }

      tex.colorSpace = SRGBColorSpace;

      if (data.useMipMap == false) {
        tex.generateMipmaps = false;
      }

      if (data.minFilter != null) {
        tex.minFilter = THREE_CONSTANTS[data.minFilter];
      }

      if (data.magFilter != null) {
        tex.magFilter = THREE_CONSTANTS[data.magFilter];
      }

      tex.needsUpdate = true;

      Textures.unlock(info);

      this.instances[info] = this.updateToInstance(tex, data, info);

      parent.add(this.instances[info]);
    }

    const wrapper = this.instances[info].add(data);

    // this.wrappers = {
    //     mesh: this.instances[data.url],
    //     wrapper: wrapper
    // }

    return wrapper;
  }

  updateToInstance(texture, data, info) {
    // debugger;

    // const instance = this.instances[i].add( data )

    // const transparent = data.url.endsWith(".png");
    const opacityPlugin = new InstanceOpacityPlugin();

    const opts = {
      side: 2,

      transparent: true,

      polygonOffset: true,

      polygonOffsetFactor: -2.0,

      polygonOffsetUnits: -8.0,
    };

    // add the opacity plugin to this options in an array plugins : [ opacityPlugin ]
    const basicMaterial = new InstancedBasic({
      ...opts,
      plugins: [opacityPlugin],
    });

    const lightingMaterial = new InstancedLambert({
      ...opts,
      plugins: [opacityPlugin],
    });

    const occlusionMaterial = new InstancedOcclusion(opts);

    basicMaterial.map = texture;

    lightingMaterial.map = texture;

    var mesh = new InstancedPipelineMesh(
      new InstancedGeometry(this.baseGeometry, {
        rotation: true,

        scale: true,

        boundingSphere: this.baseGeometry.boundingSphere,

        useNormal: true,

        transparencySorting: true,

        opacity: true,

        name: info + "_geometry",

        scaleRatio: texture.source.data.width / texture.source.data.height,
      }),

      basicMaterial,

      {
        visibleOnOcclusion: true,

        lightingMaterial: lightingMaterial,

        occlusionMaterial: occlusionMaterial,

        type: data.url,

        debug: true,
      }
    );

    mesh.receiveShadow = true;

    mesh.castShadow = true;

    mesh.customDepthMaterial = new InstancedShadow();

    return mesh;
  }

  dispose(wrapper) {
    wrapper.mesh.remove(wrapper);
  }

  disposeAll() {
    for (let url in this.instances) {
      if (this.instances[url]) {
        if (this.instances[url].parent) {
          this.instances[url].parent.remove(this.instances[url]);
        }

        DisposePipelinesMeshes(this.instances[url]);

        this.instances[url].dispose();

        this.instances[url] = null;

        Textures.remove(url);
      }
    }

    this.instances = {};
  }

  getInfos(data) {
    var str = data.url + "?";

    if (data.useMipMap == false) {
      str += "mipMap=false&";
    }

    if (data.minFilter != null) {
      str += "minFilter=" + data.minFilter + "&";
    }

    if (data.magFilter != null) {
      str += "magFilter=" + data.magFilter + "&";
    }

    return str;
  }
}
