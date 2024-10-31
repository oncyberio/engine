import {
  PlaneGeometry,
  BufferAttribute,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
} from "three";

const MAX_INSTANCED_COUNT = 400;

export default class GeometryInstancer extends InstancedBufferGeometry {
  constructor() {
    super();

    this.maxInstancedCount = MAX_INSTANCED_COUNT;

    let geometry = new PlaneGeometry(0.01, 2.5, 1, 1);

    geometry.needsUpdate = true;

    if (geometry.index) {
      this.setIndex(new BufferAttribute(geometry.index.array, 1));
    }

    if (geometry.attributes.position) {
      this.setAttribute(
        "position",
        new BufferAttribute(geometry.attributes.position.array, 3)
      );
    }

    if (geometry.attributes.uv) {
      this.setAttribute(
        "uv",
        new BufferAttribute(geometry.attributes.uv.array, 2)
      );
    }

    let i = 0;

    let offsets = [];

    let range = 30;

    while (i < MAX_INSTANCED_COUNT) {
      offsets.push(Math.random(), range * Math.random(), Math.random());

      i++;
    }

    this.setAttribute(
      "offset",
      new InstancedBufferAttribute(new Float32Array(offsets), 3, false, 1)
    );
  }
}
