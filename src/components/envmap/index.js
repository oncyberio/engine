import Loader from "engine/loader";

import Emitter from "engine/events/emitter";

import Events from "engine/events/events";

import Camera from "engine/camera";

class EnvMapFactory {
  constructor() {}

  async get(opts = {}, space) {
    const envMap = await this.getPBREnvMap(opts, space);

    return envMap;
  }

  async getPBREnvMap(opts, scene) {
    let cubeMap;

    // this reload everything we click on the same data

    if (opts.envmapType.toLowerCase() == "image") {
      cubeMap = await Loader.loadCubeImage(opts.imageOpts.image);
    } else {
      // if (opts.sceneOpts != null) {
      //     scene.position.copy(opts.sceneOpts.position);
      // }

      scene.updateMatrixWorld(true);

      Emitter.emit(Events.PRE_RENDER, scene, Camera.dummy, true);

      cubeMap = (await Loader.loadCubeMapFromScene(scene, false, opts)).texture;

      scene.position.set(0, 0, 0);
    }

    return cubeMap;
  }
}

export default new EnvMapFactory();
