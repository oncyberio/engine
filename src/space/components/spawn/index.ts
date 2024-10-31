import { DefaultComponentFactory } from "engine/abstract/defaultcomponentfactory";
import { SpawnComponent } from "./spawncomponent";
export type { SpawnComponentData } from "./spawndata";

export class SpawnComponentFactory extends DefaultComponentFactory<SpawnComponent> {
  //
  Type = SpawnComponent;

  static info = {
    type: "spawn",
    title: "Spawn",
    image:
      "https://res.cloudinary.com/ugc-oo-oo/image/upload/v1722271320/290724-spawn.jpg",
    help: {
      desc: "Define where visitors will enter your world",
    },
    description: "Define where visitors will enter your world",
    tipNeeded: true,
    singleton: true,
    required: true,
    // draggable: true,
  };

  static {
    const defaultData = {
      id: "spawn",
      kit: "cyber",
      type: "spawn",
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: {
        x: 1,
        y: 1,
        z: 1,
      },
      //
      useUserAvatar: true,
      defaultAvatar: {},
      renderMode: "default",
      useMixer: false,
      plugins: [],
      // avatarScale: 2,
    };

    this.createDataWrapper({
      defaultData,
    });
  }
}
