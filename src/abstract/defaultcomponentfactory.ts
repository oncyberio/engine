// @ts-check

import { Component3D } from "./component3D";
import { AddOpts, ComponentFactory } from "./componentfactory";

export class DefaultComponentFactory<
  T extends Component3D<any>
> extends ComponentFactory<T> {
  //
  public Type: { new (data: any): T } = null;

  async createInstance(data) {
    //
    if (this.Type == null) {
      throw new Error(
        "Type not set for default component factory " + this.info.type
      );
    }

    const instance = new this.Type({
      space: this.space,
      container: this.container,
      info: this.info,
      data,
    });

    await instance.onInit();

    return instance;
  }

  dispose() {}
}
