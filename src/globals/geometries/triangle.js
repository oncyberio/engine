import { BufferGeometry, BufferAttribute } from "three";

class Triangle extends BufferGeometry {
  constructor() {
    super();

    const vertices = new Float32Array([
      -1.0, -1.0, 0, 3.0, -1.0, 0, -1.0, 3.0, 0,
    ]);

    this.setAttribute("position", new BufferAttribute(vertices, 3));
  }
}

export default new Triangle();
