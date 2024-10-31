import { DefaultComponentFactory } from "engine/abstract/defaultcomponentfactory";
import { POST_PROCESSINGS, POST_TYPES } from "./data";
import { PostProcessingComponent } from "./postprocomponent";

export class PostProComponentFactory extends DefaultComponentFactory<PostProcessingComponent> {
  //
  Type = PostProcessingComponent;

  static info = {
    type: "postprocessing",
    title: "Filters",
    image:
      "https://res.cloudinary.com/ugc-oo-oo/image/upload/v1722271320/290724-filters.jpg",
    help: {
      desc: "Add a filter to your entire world.  Choose between one of our presets or upload your own.",
    },
    singleton: true,
    required: false,
    disableLock: true,
  };

  static {
    //
    const defaultData = {
      id: "postprocessing",
      kit: "cyber",
      type: "postprocessing",

      enabled: true,
      postProType: POST_TYPES.BLOOM,
      bloomOpts: POST_PROCESSINGS.Bloom.opts,
      lutOpts: POST_PROCESSINGS.LookUpTable.opts,
      // cybercityOpts: POST_PROCESSINGS.CyberCity.opts,
      tvOpts: POST_PROCESSINGS.TV.opts,
      trippyOpts: POST_PROCESSINGS.Trippy.opts,
    };

    this.createDataWrapper({
      defaultData,
    });
  }
}
