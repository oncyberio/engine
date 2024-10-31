import { DefaultComponentFactory } from "engine/abstract/defaultcomponentfactory";

import { VideoComponent } from "./videocomponent";
import { VideoFactory } from "engine/components/media/video";

export class VideoComponentFactory extends DefaultComponentFactory<VideoComponent> {
  Type = VideoComponent;

  static info = {
    type: "video",
    title: "Video",
    image:
      "https://res.cloudinary.com/ugc-oo-oo/image/upload/v1712074893/video.png",
    transform: true,
    draggable: true,
  };

  static {
    // debugger;
    const defaultData = {
      id: "",
      kit: "cyber",
      type: "video",
      name: "",
      url: "",
      mime_type: "",
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      borderColor: null,
      opacity: 1,
      volume: 1,
      audioType: "ambient", // ambient, positional
      autoPlay: true,
      displayMode: "flat",
      curvedAngle: Math.PI / 4,
      muted: false,
      meta: {
        addedBy: "",
        placeholder: "",
      },
    };

    this.createDataWrapper({
      defaultData,
    });
  }

  private videoFactory: VideoFactory = null;

  async init(opts) {
    this.videoFactory = new VideoFactory();

    return super.init(opts);
  }

  async createInstance(data) {
    if (this.Type == null) {
      throw new Error(
        "Type not set for default component factory " + this.info.type
      );
    }

    const instance = new VideoComponent({
      space: this.space,
      container: this.container,
      info: this.info,
      data,
      videoFactory: this.videoFactory,
    });

    await instance.onInit();

    return instance;
  }

  dispose() {
    super.dispose();

    this.videoFactory.disposeAll();

    this.videoFactory = null;
  }
}
