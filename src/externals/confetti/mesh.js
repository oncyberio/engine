import {
  Mesh,
  MeshBasicMaterial,
  BoxBufferGeometry,
  PlaneBufferGeometry,
  Group,
} from "three";

import BaseGeo from "./basegeo.js";

import ConfettiMaterial from "./material.js";

const NB = 800;

export default class Confetti extends Group {
  constructor(colors, limit) {
    super();

    this.materialPlane = new ConfettiMaterial(limit, "square");
    this.materialCircle = new ConfettiMaterial(limit, "circle");

    const planeGeometry = new BaseGeo(NB * 0.7, colors, "square");
    const circleGeometry = new BaseGeo(NB * 0.3, colors, "circle");

    this.planeMesh = new Mesh(planeGeometry, this.materialPlane);

    this.planeMesh.frustumCulled = false;

    this.add(this.planeMesh);

    this.circleMesh = new Mesh(circleGeometry, this.materialCircle);

    this.circleMesh.frustumCulled = false;

    this.add(this.circleMesh);
  }

  setTimer(val) {
    this.materialPlane.timer = val;
    this.materialCircle.timer = val;
  }

  destroy() {
    this.planeMesh.geometry.dispose();
    this.circleMesh.geometry.dispose();

    this.materialPlane.dispose();
    this.materialCircle.dispose();
  }
}
