import {
  BoxHelper,
  Mesh,
  Box3,
  Vector3,
  BoxGeometry,
  Matrix4,
  MeshBasicMaterial,
} from "three";

import DebugMaterial from "./material";

const bbTarget = new Vector3();

const wmat = new MeshBasicMaterial({ wireframe: true });

class DebugBoxFactory {
  constructor() {
    this.material = new DebugMaterial();
  }

  getBox(object) {
    let input = object;

    // if geometry

    if (object.attributes) {
      input = new Mesh(object);
    }

    let box = new BoxHelper(input, 0xffff00);

    let oldBoxMaterial = box.material;

    box.material = this.material;

    box.transparent = true;

    box.renderOrder = 100000;

    oldBoxMaterial.dispose();

    oldBoxMaterial = null;

    return box;
  }

  getBoxFromArray(array) {
    let minX = Infinity;
    let minY = Infinity;
    let minZ = Infinity;

    let maxX = -Infinity;
    let maxY = -Infinity;
    let maxZ = -Infinity;

    let i = 0;

    while (i < array.length) {
      const geometry = array[i];

      geometry.computeBoundingBox();

      const bBox = geometry.boundingBox;

      // compute overall bbox
      minX = Math.min(minX, bBox.min.x);
      minY = Math.min(minY, bBox.min.y);
      minZ = Math.min(minZ, bBox.min.z);
      maxX = Math.max(maxX, bBox.max.x);
      maxY = Math.max(maxY, bBox.max.y);
      maxZ = Math.max(maxZ, bBox.max.z);

      i++;
    }

    var bBox_min = new Vector3(minX, minY, minZ);
    var bBox_max = new Vector3(maxX, maxY, maxZ);
    var bBox_new = new Box3(bBox_min, bBox_max);

    bBox_new.getSize(bbTarget);

    const { x, y, z } = bbTarget;

    let boxGeo = new BoxGeometry(x, y, z);

    const matrix = new Matrix4().setPosition(
      bbTarget.addVectors(bBox_new.min, bBox_new.max).multiplyScalar(0.5)
    );

    boxGeo.applyMatrix4(matrix);

    return boxGeo;
  }

  getMesh(object) {
    let input = object;

    if (object.attributes) {
      input = new Mesh(object);
    }

    var boxHelper = new BoxHelper(input);

    boxHelper.geometry.computeBoundingBox();

    const box3 = boxHelper.geometry.boundingBox;

    box3.getSize(bbTarget);

    const { x, y, z } = bbTarget;

    let boxGeo = new BoxGeometry(x, y, z);

    const matrix = new Matrix4().setPosition(
      bbTarget.addVectors(box3.min, box3.max).multiplyScalar(0.5)
    );

    boxGeo.applyMatrix4(matrix);

    return new Mesh(boxGeo, wmat);
  }

  getMeshFromObjects(object) {
    const box = new Box3();

    box.expandByObject(object);

    box.getSize(bbTarget);

    const { x, y, z } = bbTarget;

    let boxGeo = new BoxGeometry(x, y, z);

    bbTarget.set(0, (box.min.y + box.max.y) * 0.5, 0);

    const matrix = new Matrix4().setPosition(bbTarget);

    boxGeo.applyMatrix4(matrix);

    return new Mesh(boxGeo, wmat);
  }

  destroy(box) {
    if (box.parent) {
      box.parent.remove(box);
    }

    box.geometry.dispose();

    box = null;
  }
}

export default new DebugBoxFactory();
