// @ts-check

import { Component3D, DataChangeOpts } from "engine/abstract/component3D";
import { LUTMAPS, POST_TYPES } from "./data";
import postprocessing from "engine/postprocessing";
import { Assets } from "engine/assets";
import { $Param, Param, Receiver } from "engine/space/params";
import { IS_EDIT_MODE, SET_SHADOW_NEEDS_UPDATE } from "engine/constants";
/**
 * @public
 *
 * Post processing component, used to apply post processing effects to the game. Use the studio to configure the post processing for the space.
 *
 * This is a singleton component. You can only have one post processing in the game.
 */
export class PostProcessingComponent extends Component3D<any> {
  //
  protected async init() {
    this.matrixAutoUpdate = false;

    this.matrixWorldAutoUpdate = false;

    this._update3D();
  }

  @Param() enabled = true;
  @Param() postProType = "Bloom";
  @Param() bloomOpts = new BloomOpts();
  @Param() lutOpts = new LutOpts();
  @Param() tvOpts = new TvOpts();
  @Param() trippyOpts = new TrippyOpts();

  private _update3D() {
    const opts = postprocessing.options;

    opts.enabled = this.enabled;
    opts.type = this.postProType;

    if (this.postProType === POST_TYPES.BLOOM) {
      opts.value = {
        color: this.bloomOpts.color,
        intensity: this.bloomOpts.intensity,
        radius: this.bloomOpts.radius,
        smoothing: this.bloomOpts.smoothing,
        threshold: this.bloomOpts.threshold,
      };
    } else if (this.postProType === POST_TYPES.LOOK_UP_TABLE) {
      //console.log("opts, data", opts, data);
      opts.value = {
        image: {
          ...this.lutOpts.image,
          path:
            this.data.customUpload?.path ||
            this.lutOpts?.image?.path ||
            this.lutOpts?.image?.url ||
            Assets.lutmaps[this.lutOpts?.image?.id] ||
            LUTMAPS.hudson.path,
        },
      };
      //
      console.log("lutmap", opts.value.image.path);
    } else if (this.postProType === POST_TYPES.CYBERCITY) {
      opts.value = structuredClone(this.data.cybercityOpts);
    } else if (this.postProType === POST_TYPES.TRIPPY) {
      opts.value = {
        speed: this.trippyOpts.speed,
      };
    } else if (this.postProType === POST_TYPES.TV) {
      opts.value = {
        amount: this.tvOpts.amount,
        glitchRatio: this.tvOpts.glitchRatio,
        speed: this.tvOpts.speed,
        strength: this.tvOpts.strength,
        vignetteFallOff: this.tvOpts.vignetteFallOff,
        vignetteStrength: this.tvOpts.vignetteStrength,
      };
    } else if (this.postProType === "custom") {
      const kernel = this.data.customOpts.kernel;
      opts.value = structuredClone(this.data.customOpts);
      opts.value.kernel = kernel;
    }
  }

  /**
   * @internal
   */
  onDataChange(opts: DataChangeOpts): void {
    this._update3D();

    if (this.enabled != opts.prev?.enabled) {
      if (IS_EDIT_MODE) {
        SET_SHADOW_NEEDS_UPDATE(true);
      }
    }
  }

  @Receiver()
  enable() {
    this.enabled = true;
  }

  @Receiver()
  disable() {
    this.enabled = false;
  }

  protected dispose() {
    postprocessing.options.enabled = false;
  }
}

class BloomOpts {
  @Param() threshold = 0.75;
  @Param() smoothing = 0.29;
  @Param() intensity = 0.6;
  @Param() radius = 0.7;
  @Param({ type: "color" }) color = "#ffffff";
}

class LutOpts {
  @Param() image = $Param.Resource("image");
}

class TrippyOpts {
  @Param() speed = 0.1;
}

class TvOpts {
  @Param() amount = 1.0;
  @Param() strength = 1.0;
  @Param() glitchRatio = 0.2;
  @Param() speed = 1.0;
  @Param() vignetteFallOff = 0;
  @Param() vignetteStrength = 1;
}
