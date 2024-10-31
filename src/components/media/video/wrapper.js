// @ts-check

import {
  Object3D,
  MeshLambertMaterial,
  MeshBasicMaterial,
  PlaneGeometry,
  BufferGeometry,
  DoubleSide,
  Mesh,
  Vector2,
} from "three";

import PipeLineMesh from "engine/abstract/pipelinemesh";

import { DisposePipelinesMeshes } from "engine/utils/dispose.js";

export default class VideoWrapper extends Object3D {
  constructor(textures = {}, videoData = {}, data = {}) {
    super();

    this._opacity = data.opacity || 1;

    this.currentInstanceContent = textures.content;

    this.baseGeometry = new PlaneGeometry(1, 1);

    this.curvedGeometry = null;

    this.mesh = new PipeLineMesh(
      this.baseGeometry,
      new MeshBasicMaterial({
        side: 2,
        map: textures.previewTexture,
        polygonOffset: true,
        polygonOffsetFactor: -2.0,
        polygonOffsetUnits: -8.0,
        transparent: true,
      }),
      {
        lightingMaterial: new MeshLambertMaterial({
          name: "VIDEO_LIGHTING_MATERIAL",
          side: 2,
          map: textures.previewTexture,
          transparent: true,
        }),
        occlusionMaterial: new MeshBasicMaterial({
          name: "VIDEO_OCCLUSION_MATERIAL",
          side: 2,
          color: 0x000000,
        }),
      }
    );

    if (data.displayMode == "curved") {
      this.updateDisplayMode(data);
    }

    // set ratio to the preview first

    this.scale.set(textures.previewTexture.ratio, 1, 1);

    this.mesh.receiveShadow = true;

    this.mesh.castShadow = true;

    this.textures = textures;

    this.videoData = videoData;

    if (data.opacity) {
      this.opacity = data.opacity;
    }

    this._isPlaying = false;

    this.isPreview = true;

    this.add(this.mesh);
  }

  play() {
    //
    if (this.videoData.video == null) return;

    if (this._isPlaying == false) {
      //
      this.videoData.video.play();

      this.mesh.diffuseMaterials.material.map = this.videoData.videoTexture;

      this.mesh.lightingMaterials.material.map = this.videoData.videoTexture;

      const ratio =
        this.videoData.video.videoWidth / this.videoData.video.videoHeight;
      console.log(
        ratio,
        this.videoData.video.videoWidth,
        this.videoData.video.videoHeight
      );

      this.scale.set(ratio, 1, 1);

      this._isPlaying = true;

      this.isPreview = false;
    }
  }

  pause() {
    //
    if (this.videoData.video == null) return;

    if (this._isPlaying == true) {
      this.videoData.video.pause();

      this._isPlaying = false;
    }
  }

  updateDisplayMode(data) {
    if (data.displayMode == "curved" && data.curvedAngle != 0) {
      if (this.curvedGeometry == null) {
        this.curvedGeometry = new PlaneGeometry(1, 1, 30, 1);
      }

      this.mesh.geometry = this.curvedGeometry;

      this.planeCurve(this.curvedGeometry, data.curvedAngle);
    } else {
      this.mesh.geometry = this.baseGeometry;
    }
  }

  planeCurve(g, z) {
    let p = g.parameters;
    let hw = p.width * 0.5;

    let a = new Vector2(-hw, 0);
    let b = new Vector2(0, z);
    let c = new Vector2(hw, 0);

    let ab = new Vector2().subVectors(a, b);
    let bc = new Vector2().subVectors(b, c);
    let ac = new Vector2().subVectors(a, c);

    let r =
      (ab.length() * bc.length() * ac.length()) / (2 * Math.abs(ab.cross(ac)));

    if (r == Infinity || isNaN(r)) {
      r = 0;
    }

    let center = new Vector2(0, z - r);
    let baseV = new Vector2().subVectors(a, center);
    let baseAngle = baseV.angle() - Math.PI * 0.5;
    let arc = baseAngle * 2;

    let uv = g.attributes.uv;
    let pos = g.attributes.position;
    let mainV = new Vector2();
    for (let i = 0; i < uv.count; i++) {
      let uvRatio = 1 - uv.getX(i);
      let y = pos.getY(i);
      mainV.copy(c).rotateAround(center, arc * uvRatio);
      pos.setXYZ(i, mainV.x, y, -mainV.y);
    }

    pos.needsUpdate = true;
  }

  stop() {
    //
    if (this.videoData.video == null) return;

    if (this._isPlaying || this.isPreview == false) {
      this.videoData.video.pause();

      this.mesh.diffuseMaterials.material.map = this.textures.previewTexture;

      this.mesh.lightingMaterials.material.map = this.textures.previewTexture;

      // this.scale.set(this.textures.previewTexture.ratio, 1, 1);

      this.isPreview = true;

      this._isPlaying = false;
    }
  }

  set opacity(value) {
    this._opacity = value;

    this.mesh.material.opacity = value;

    this.mesh.diffuseMaterials.material.opacity = value;

    this.mesh.lightingMaterials.material.opacity = value;
  }

  get opacity() {
    return this._opacity;
  }

  buildCollisionMesh() {
    const geometry = new BufferGeometry();

    geometry.setAttribute(
      "position",
      this.baseGeometry.getAttribute("position")
    );

    geometry.setAttribute("uv", this.baseGeometry.getAttribute("uv"));

    geometry.setIndex(this.baseGeometry.getIndex());

    const material = new MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      side: DoubleSide,
    });
    const mesh = new Mesh(geometry, material);

    mesh.scale.x = this.textures.previewTexture.ratio || 1;

    mesh.visible = false;

    return mesh;
  }

  dispose() {
    this.stop();

    if (this.textures.previewTexture != null) {
      const index = this.currentInstanceContent.indexOf(this);

      if (index > -1) {
        this.currentInstanceContent.splice(index, 1);
      }

      if (this.currentInstanceContent.length == 0) {
        this.textures.previewTexture.dispose();
      }
    }

    this.textures.previewTexture.dispose();

    // debugger

    if (this.videoData.videoTexture != null) {
      //
      this.videoData.videoTexture.dispose();
    }

    if (this.videoData.video != null) {
      //
      this.videoData.video = null;
    }

    if (this.mesh) {
      DisposePipelinesMeshes(this.mesh, true);

      this.mesh.dispose();

      this.mesh = null;
    }
  }
}
