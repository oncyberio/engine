import { DefaultComponentFactory } from "engine/abstract/defaultcomponentfactory";
import { ModelFactory } from "engine/components/media/model";
import { ModelComponent } from "./modelcomponent";
import { Engine } from "engine/index";

export class ModelComponentFactory extends DefaultComponentFactory<ModelComponent> {
  Type = ModelComponent;

  static info = {
    type: "model",
    title: "Model",
    image:
      "https://res.cloudinary.com/ugc-oo-oo/image/upload/v1712130115/model.png",
    transform: true,
    draggable: true,
  };

  static getTitle(data: any) {
    //
    const instance = Engine.getInstance()
      ?.getCurrentSpace?.()
      .components?.byInternalId(data.id);

    let title = instance.data.name;

    let url = (instance.data as any).url;

    if (!title) {
      // strip name from url
      if (url) {
        //
        const idx = data.url.lastIndexOf("/");

        title = data.url.substring(idx + 1);
      } else {
        //
        title = "Model";
      }
    }

    return title;
  }

  static {
    // debugger;

    const defaultData = {
      kit: "cyber",
      type: "model",
      name: "",
      url: "",
      optimized: {
        high: "",
        low: "",
        low_compressed: "",
      },
      mime_type: "model/gltf-binary",
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      envmap: "scene",
      envmapIntensity: 1,
      animations: {},
      meta: {
        addedBy: "",
        placeholder: "",
      },
      renderMode: "default",
      enableAnimation: false,
      opacity: 1,
      enableRealTimeShadow: false,
      useTransparency: false,
      center: true,
    };

    this.createDataWrapper({
      defaultData,
      valuePaths: ["animations", "optimized"],
    });
  }

  private modelFactory: ModelFactory = null;

  async init(opts) {
    //
    this.modelFactory = new ModelFactory();

    return super.init(opts);
  }

  async createInstance(data) {
    if (this.Type == null) {
      throw new Error(
        "Type not set for default component factory " + this.info.type
      );
    }

    const instance = new ModelComponent({
      space: this.space,
      container: this.container,
      info: this.info,
      data,
      modelFactory: this.modelFactory,
    });

    await instance.onInit();

    return instance;
  }

  upgradeData(data) {
    // @ts-ignore

    // to do // sync in database
    // @TODO: we need a more general solution to upgrade data
    // for prefabs
    if (data.enableAnimation == null && !data.prefabId) {
      // samsy
      data.enableAnimation = Object.keys(data.animations || {}).length > 0;
    }

    return super.upgradeData(data);
  }

  protected validate(data: any): void {
    // if (this.modelFactory.isValid(data) === false) {
    //     throw new Error("Invalid model config");
    // }
  }

  dispose() {
    super.dispose();

    this.modelFactory.disposeAll();

    this.modelFactory = null;
  }
}
