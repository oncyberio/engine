import { FogComponent } from "./fogcomponent";
import { DefaultComponentFactory } from "engine/abstract/defaultcomponentfactory";

export class FogComponentFactory extends DefaultComponentFactory<FogComponent> {
  //
  Type = FogComponent;

  static info = {
    type: "fog",
    title: "Fog",
    image:
      "https://res.cloudinary.com/ugc-oo-oo/image/upload/v1722271320/290724-fog.jpg",
    help: {
      tip: "Tip: Fog can soften the hard edge of your World",
    },
    singleton: true,
    priority: 6,
    disableLock: true,
  };

  static {
    //
    const defaultData = {
      id: "fog",
      kit: "cyber",
      type: "fog",
      enabled: true,
      near: 300,
      far: 500,
      fadeColor: "#054d73",
    };

    this.createDataWrapper({
      defaultData,
    });
  }
}
