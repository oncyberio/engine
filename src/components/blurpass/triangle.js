import { Float32BufferAttribute, BufferGeometry } from "three";

class Triangle extends BufferGeometry {
  constructor() {
    super();

    this.setIndex([2, 1, 0]);

    this.setAttribute(
      "position",
      new Float32BufferAttribute([-1, -1, 0, -1, 4, 0, 4, -1, 0], 3)
    );

    this.needsUpdate = true;
  }
}

let tri = new Triangle();

export default tri;
