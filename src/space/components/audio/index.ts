import { AudioComponent } from "./audiocomponent";
import { DefaultComponentFactory } from "engine/abstract/defaultcomponentfactory";
import { AudioLoader } from "./audioloader";

export class AudioComponentFactory extends DefaultComponentFactory<AudioComponent> {
  //
  Type = AudioComponent;

  audioLoader = new AudioLoader();

  static info = {
    type: "audio",
    title: "Audio",
    image:
      "https://res.cloudinary.com/ugc-oo-oo/image/upload/v1712129988/Audio.png",
    autoPlace: true,
    draggable: true,
    transform: true,
    prefab: true,
  } as const;

  static {
    //
    const defaultData = {
      id: "",
      kit: "cyber",
      type: "audio",
      name: "",
      url: "",
      mime_type: "audio/mpeg",
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      volume: 1,
      loop: false,
      audioType: "ambient", // ambient, positional
      autoPlay: false,
      playbackRate: 1,
      meta: {
        addedBy: "",
        placeholder: "",
      },
    };

    this.createDataWrapper({
      defaultData,
    });
  }

  async createInstance(data) {
    const instance = new AudioComponent({
      space: this.space,
      container: this.container,
      info: this.info,
      data,
    });

    // @ts-ignore
    instance._loader = this.audioLoader;

    await instance.onInit();

    return instance;
  }

  dispose(): void {
    this.audioLoader.dispose();
  }
}
