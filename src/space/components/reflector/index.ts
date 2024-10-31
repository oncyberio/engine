import { DefaultComponentFactory } from "engine/abstract/defaultcomponentfactory";
import { ReflectorComponent } from "./reflectorcomponent";
import { normalMaps } from "./data";

export class ReflectorComponentFactory extends DefaultComponentFactory<ReflectorComponent> {
  //
  Type = ReflectorComponent;

  static info = {
    type: "reflector",
    title: "Reflector",
    image:
      "https://res.cloudinary.com/ugc-oo-oo/image/upload/v1722271320/290724-reflector.jpg",
    singleton: true,
    required: false,
    transform: {
      position: true,
      rotation: true,
    },
  };

  static {
    //
    const defaultData = {
      id: "reflector",
      kit: "cyber",
      type: "reflector",
      color: "#9fbada",
      position: { x: 0, y: 0.01, z: 0 },
      scale: { x: 1000, z: 1000 },
      opacity: 1,
      blur: true,
      normalmap: {
        enabled: false,
        strength: 0.5,
        tiles: 0.3,
        images: normalMaps.bump,
        customImage: null,
      },
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
    if (config.water != null) {
      return {
        success: false,
        message: "You have already selected a water surface for your world.",
      };
    }

    return { success: true };
  }
}
