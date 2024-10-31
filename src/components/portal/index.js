import Textures from "engine/textures.js";

import {
  Euler,
  MeshBasicMaterial,
  PlaneGeometry,
  Quaternion,
  SRGBColorSpace,
} from "three";

import PipeLineMesh from "engine/abstract/pipelinemesh";

import Material360 from "./material360";

import Material2D from "./material2D";

import Camera from "engine/camera";

const tempQuat = new Quaternion();

const tmpEuler = new Euler();

export class PortalFactory {
  height = 0;

  width = 0;

  constructor() {
    this.isInit = false;

    this._init = false;

    this._instances = [];

    // globalThis.PortalFactory = this;
  }

  get = async (parent, data = {}) => {
    await this.preload();
    console.log("get Portal...", !data.previewImage?.img360);

    var preview;
    var is360 = false;
    if (data.previewImage?.img360) {
      is360 = true;
      preview = data.previewImage.img360;
    } else {
      preview = data.previewImage.img;
    }

    const portalTexture = await Textures.loadOnce({
      name: preview,
      url: preview,
    });

    portalTexture.colorSpace = SRGBColorSpace;

    Textures.unlock(portalTexture);

    let opts = {
      map: portalTexture,
      side: 2,
    };

    var material = is360 ? new Material360(opts) : new Material2D(opts);

    const diffuseMaterial = material;

    const lightingMaterial = material;

    const baseWidth = 2.8 * 2;
    const baseHeight = baseWidth * 0.63;
    // export const DEF_PORTAL_HEIGHT = USER_HEIGHT * 2

    // export const DEF_PORTAL_WIDTH = DEF_PORTAL_HEIGHT * 0.63

    this.width = data.width || baseHeight;

    this.height = data.height || baseWidth;

    this.geometry = new PlaneGeometry(this.width, this.height, 1, 1);
    // geometry.rotateX(Math.PI * 0.5);

    const mesh = new PipeLineMesh(
      this.geometry,

      diffuseMaterial,

      {
        lightingMaterial: lightingMaterial,

        occlusionMaterial: new MeshBasicMaterial({ color: 0x000000 }),
      }
    );

    mesh.name = "portal";

    mesh.receiveShadow = true;

    mesh.castShadow = true;

    if (parent != null) {
      parent.add(mesh);
    }

    this._instances.push(mesh);

    if (data.position) {
      mesh.position.copy(data.position);
    }

    if (data.scale) {
      mesh.scale.copy(data.scale);
    }

    if (data.rotation) {
      mesh.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
    }

    mesh.castShadow = true;

    mesh.receiveShadow = true;

    mesh.userData.width = this.width;
    mesh.userData.height = this.height;

    if (is360) {
      mesh.getWorldQuaternion(tempQuat);

      tmpEuler.setFromQuaternion(tempQuat);

      material.uniforms.rotation.value = tmpEuler.y - Math.PI * 0.5;

      material.uniforms.scaleFactor.value = 1;
    } else {
      material.uniforms.aspect.value = this.getAspect(
        baseWidth,
        baseHeight,
        data.scale
      );
    }

    return mesh;
  };

  getAspect(width, height, scale) {
    let scaleAspect = scale.x / scale.y;

    let geoAspect = width / height;

    return scaleAspect * geoAspect;
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
