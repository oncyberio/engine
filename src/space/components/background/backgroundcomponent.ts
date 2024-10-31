import BackgroundFactory, {
  BackgroundMesh,
  BackgroundOpts,
} from "engine/components/background";
import { Component3D, DataChangeOpts } from "engine/abstract/component3D";
import { presetImages } from "./data.js";

import { DisposePipelinesMeshes } from "engine/utils/dispose.js";
import { Assets } from "engine/assets";
/**
 * @public
 *
 * The background component is used to set the background of the game. You can set the
 * background appareance from the studio.
 *
 * At runtime right now you can only change the color of the background, but we plan to
 * add more options in the future.
 *
 * Bakckground is a singleton, so you can only have one background in the game.
 */
export class BackgroundComponent extends Component3D {
  //

  /**
   * @internal
   */
  _background: BackgroundMesh;

  /**
   * @internal
   */
  async init() {
    this.matrixAutoUpdate = false;

    this.matrixWorldAutoUpdate = false;
    //
    const params = this.#getBackgroundOptsFromData(this.data);

    return this.load(params);
  }

  #frameId = 0;

  /**
   * @internal
   */
  async load(params: BackgroundOpts) {
    // this._background = this.space.background = null;

    let frameId = ++this.#frameId;

    const background = await BackgroundFactory.get(params);

    if (frameId !== this.#frameId) return;

    this._background = this.space.background = background;
  }

  #getBackgroundOptsFromData(data): BackgroundOpts {
    let params: BackgroundOpts;

    const type = data.backgroundType;

    if (type == "Color") {
      params = { type: "color", color: data.colorOpts.color };
    } else if (type == "Texture") {
      if (data.textureOpts.textureType == "Sky") {
        params = {
          type: "sky",
          options: structuredClone(data.textureOpts.skyOpts),
        };
      } else if (data.textureOpts.textureType == "Image") {
        let options = structuredClone(data.textureOpts.imageOpts.image);

        options.path =
          Assets.background[options.id] ??
          options.path ??
          presetImages.day2.path;

        options.image = options.path;

        params = { type: "image", options };
      }
    } else if (type == "backdrop") {
      params = { type: "backdrop", options: data.backdropOpts };
    }

    return params;
  }

  /**
   * @internal
   */
  async update(opts: BackgroundOpts) {
    if (
      this._background.backgroundType == opts.type &&
      this._background.updateOpts
    ) {
      this._background.updateOpts(opts);
    } else {
      await this.load(opts);
    }

    const fog = this.container.byType("fog")?.[0];

    // @ts-ignore
    fog?._update3D();
  }

  /**
   * Change the background to a color
   */
  setColor(val) {
    this.update({ type: "color", color: val });
  }

  /**
   * @internal
   */
  onDataChange(opts: DataChangeOpts): void {
    //
    const params = this.#getBackgroundOptsFromData(this.data);

    let update =
      !opts.isProgress ||
      (params.type == this._background.backgroundType &&
        (params.type === "color" || params.type === "sky"));

    if (update) {
      this.update(params);
    }
  }

  /**
   * @internal
   */
  dispose() {
    this.#frameId = -1;

    DisposePipelinesMeshes(this.space.background);

    if (this.space?.background?.getRaw()) {
      console.log("disposing raw target");

      if (this.space?.background?.getRaw().renderTarget?.dispose) {
        this.space?.background?.getRaw().renderTarget?.dispose();
      } else if (this.space?.background?.getRaw()?.sharp?.dispose) {
        this.space?.background?.getRaw()?.sharp?.dispose();
      } else if (this.space?.background?.getRaw()?.dispose) {
        this.space?.background?.getRaw()?.dispose();
      }
    }

    this.space.background.dispose();

    this.space.background = null;
  }
}
