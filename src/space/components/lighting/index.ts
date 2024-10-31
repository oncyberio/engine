import { LightingComponent } from "./lightingcomponent";
import { DefaultComponentFactory } from "engine/abstract/defaultcomponentfactory";

export class LightingComponentFactory extends DefaultComponentFactory<LightingComponent> {
  //
  Type = LightingComponent;

  static info = {
    type: "lighting",
    title: "Lighting",
    image:
      "https://res.cloudinary.com/ugc-oo-oo/image/upload/v1722271320/290724-light.jpg",
    help: {
      desc: "Adjust the light to change shadows in your world",
    },
    description: "Adjust the light to change shadows in your world",
    tipNeeded: true,
    singleton: true,
    required: true,
  };

  static {
    //
    const defaultData = {
      id: "lighting",
      kit: "cyber",
      type: "lighting",

      enabled: true,
      lightDirection: { x: -1, y: -1, z: -1 },
      lightPosition: { x: 200, y: 200, z: 200 },
      bias: -0.002,
      near: 139.4,
      far: 513,
      intensity: 1,
      size: 500,
    };

    this.createDataWrapper({
      defaultData,
    });
  }
}
