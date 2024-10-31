import { DefaultComponentFactory } from "engine/abstract/defaultcomponentfactory";
import { GroupComponent } from "./groupcomponent";

export class GroupComponentFactory extends DefaultComponentFactory<GroupComponent> {
  //
  Type = GroupComponent;

  static info = {
    type: "group",
    title: "Group",
    image:
      "https://res.cloudinary.com/ugc-oo-oo/image/upload/v1708091342/rain.webp",
    transform: true,
    prefab: true,
  };

  static {
    //
    const defaultData = {
      id: "",
      name: "",
      type: "group",
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    };

    this.createDataWrapper({
      defaultData,
    });
  }
}
