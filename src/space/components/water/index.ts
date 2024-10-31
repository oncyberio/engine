import { DefaultComponentFactory } from "engine/abstract/defaultcomponentfactory";
import { WaterComponent } from "./watercomponent";

export class WaterComponentFactory extends DefaultComponentFactory<WaterComponent> {
  //
  Type = WaterComponent;

  static info = {
    type: "water",
    title: "Water",
    image:
      "https://res.cloudinary.com/ugc-oo-oo/image/upload/v1722271320/290724-water.jpg",
    singleton: true,
    disableLock: true,
  };

  static {
    //
    const defaultData = {
      id: "water",
      kit: "cyber",
      type: "water",
      color: "#001E0F",
      opacity: 1,
      scale: { x: 1000, z: 1000 },
      position: { x: 0, y: 1, z: 0 },
      collider: {
        enabled: true,
        rigidbodyType: "FIXED",
        type: "MESH",
      },
    };

    this.createDataWrapper({
      defaultData,
    });
  }

  static validateCreation(config) {
    console.log("validateCreation", config.reflector);
    if (config.reflector != null) {
      return {
        success: false,
        message: "You have already selected a reflector for your world.",
      };
    }

    return { success: true };
  }
}
