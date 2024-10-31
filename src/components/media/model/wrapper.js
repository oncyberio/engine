import { Object3D } from "three";

export default class InstancedModelWrapper extends Object3D {
  constructor(instances) {
    super();

    this.setInstances(instances);
  }

  addItem(data) {
    let i = 0;

    let first = null;

    while (i < this.instances.length) {
      const instance = this.instances[i].add(data);

      if (i == 0) {
        first = instance;
      }

      i++;
    }

    return first;
  }

  setInstances(instances) {
    this.instances = instances;

    let i = 0;

    while (i < instances.length) {
      this.add(instances[i]);

      i++;
    }

    // console.log( this )
  }
}
