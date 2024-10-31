import WaterObject from "./waterobject.js";

import {
  Vector3,
  PlaneGeometry,
  RepeatWrapping,
  TextureLoader,
  MathUtils,
} from "three";

import Shared from "engine/globals/shared";

import { Assets } from "engine/assets";

export default class WaterWrapper extends WaterObject {
  constructor() {
    // ["2.1","1.3","0.7","#0b0b66",""]

    const waterGeometry = new PlaneGeometry(1, 1, 10, 10);

    super(waterGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new TextureLoader().load(
        Assets.textures.waterNormals,
        function (texture) {
          texture.wrapS = texture.wrapT = RepeatWrapping;
        }
      ),
      sunDirection: new Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 3.7,
      fog: true,
    });

    this.receiveShadow = true;

    this.isWaterObject = true;

    const sun = new Vector3();

    const phi = MathUtils.degToRad(90 - 2);
    const theta = MathUtils.degToRad(180);

    sun.setFromSphericalCoords(1, phi, theta);

    // sunPosition.setFromSphericalCoords(1, phi, theta);

    this.material.uniforms["sunDirection"].value.copy(sun).normalize();

    this.material.uniforms.time = Shared.timer_d2;

    this.active = true;
  }

  set opacity(val) {
    this.material.uniforms.alpha.value = val;
  }

  get opacity() {
    return this.material.uniforms.alpha.value;
  }

  set color(val) {
    this.material.uniforms.waterColor.value.set(val);
  }

  get color() {
    return this.material.uniforms.waterColor.value;
  }
}
