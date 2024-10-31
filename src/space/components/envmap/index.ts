import { COMPONENT_PRIORITY } from "engine/abstract/componentfactory";
import { EnvmapComponent } from "./envmapcomponent";
import { envmaps } from "./data";
import { DefaultComponentFactory } from "engine/abstract/defaultcomponentfactory";

export class EnvmapComponentFactory extends DefaultComponentFactory<EnvmapComponent> {
  //
  Type = EnvmapComponent;

  static info = {
    type: "envmap",
    title: "Envmap",
    image:
      "https://res.cloudinary.com/ugc-oo-oo/image/upload/v1722271320/290724-env.jpg",
    description: "Simulates realistic backgrounds and surroundings",
    tipNeeded: true,
    singleton: true,
    required: true,
    draggable: false,
    priority: COMPONENT_PRIORITY.LOW,
  };

  static {
    //
    const defaultData = {
      id: "envmap",
      kit: "cyber",
      type: "envmap",
      envmapType: "Scene", // "Scene" | "Image"
      sceneOpts: {
        position: { x: 0, y: 0, z: 0 },
      },
      imageOpts: {
        image: envmaps.studio,
      },
    };

    this.createDataWrapper({
      defaultData,
    });
  }
}
