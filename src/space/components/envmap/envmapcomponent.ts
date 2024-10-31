// @ts-check

import Emitter from "engine/events/emitter";
import Events from "engine/events/events";
import { Component3D, DataChangeOpts } from "engine/abstract/component3D";
import { Texture } from "three";
import EnvMapFactory from "engine/components/envmap";
import { FBO_DEBUG } from "engine/constants";
import FBOHelper from "engine/globals/fbohelper";
import { Assets } from "engine/assets";

/**
 * @public
 *
 * This component is used to display an environment map in the game. Use the studio to configure the environment for the space.
 *
 * This is a singleton component. You can only have one environment map in the game.
 */
export class EnvmapComponent extends Component3D<any> {
  //
  private _envMap: Texture = null;

  protected async init() {
    await this._update3D();
  }

  private _abort: AbortController = null;

  private async _update3D() {
    //
    this._abort?.abort();

    const abort = (this._abort = new AbortController());

    const data = structuredClone(this.data);

    if (data.imageOpts.image) {
      //
      data.imageOpts.image.path =
        Assets.envmap[data.imageOpts.image.id] ?? data.imageOpts.image.path;
    }

    // next frame
    await new Promise((resolve) => {
      Emitter.once(Events.POST_UPDATE, resolve);
    }); // eslint-disable-line

    const envMap = await EnvMapFactory.get(data, this.space);

    if (abort.signal.aborted) return;

    this._disposeEnvMap();

    this._envMap = envMap;

    this.space.envMap = this._envMap;

    if (FBO_DEBUG) {
      FBOHelper.attach(envMap, "envMap");
    }
  }

  /**
   * @internal
   */
  onDataChange(opts: DataChangeOpts): void {
    //
    if (opts.isProgress) return;

    this._update3D();
  }

  private _disposeEnvMap() {
    this._envMap?.dispose();

    // @ts-ignore
    if (this._envMap?.renderTarget) {
      // @ts-ignore
      this._envMap?.renderTarget.dispose();
    }

    this.space.envMap = null;

    if (FBO_DEBUG) {
      FBOHelper.hideAll();
      FBOHelper.detach(this._envMap, "envMap");
    }
  }

  protected dispose() {
    this._disposeEnvMap();
  }
}
