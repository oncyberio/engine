import { DefaultComponentFactory } from "engine/abstract/defaultcomponentfactory";
import { ImageFactory } from "engine/components/media/image";
import { IframeComponent } from "./iframecomponent";

export class IframeComponentFactory extends DefaultComponentFactory<IframeComponent> {
  //
  Type = IframeComponent;

  static info = {
    type: "iframe",
    title: "Iframe",
    image:
      "https://cyber.mypinata.cloud/ipfs/QmSVD3roskck6Ra3vduYfVA49kvyX79Rx97rZiAUB4rSRQ",
    draggable: true,
    transform: true,
    prefab: true,
  };

  static {
    // debugger;

    const defaultData = {
      id: "",
      kit: "cyber",
      type: "iframe",
      name: "",
      url: "https://docs.oncyber.io/",
      mime_type: "",
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 16, y: 9, z: 1 },
      opacity: 1,
      meta: {
        addedBy: "",
        placeholder: "",
      },
      collider: {
        enabled: true,
        sensor: true,
        rigidbodyType: "KINEMATIC",
        type: "CUBE",
      },
    };

    this.createDataWrapper({
      defaultData,
    });
  }

  //private imageFactory: ImageFactory = null;

  async init(opts) {
    //
    // this.imageFactory = new ImageFactory();

    return super.init(opts);
  }

  async createInstance(data) {
    //
    if (this.Type == null) {
      throw new Error(
        "Type not set for default component factory " + this.info.type
      );
    }

    const instance = new IframeComponent({
      space: this.space,
      container: this.container,
      info: this.info,
      data,
      // imageFactory: this.imageFactory,
    });

    await instance.onInit();

    return instance;
  }

  dispose() {
    //
    super.dispose();
  }
}
