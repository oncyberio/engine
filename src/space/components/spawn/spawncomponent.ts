// @ts-check

import { Component3D, DataChangeOpts } from "engine/abstract/component3D";
import Camera from "engine/camera";
import { Euler } from "three";
import { IS_EDIT_MODE } from "engine/constants";

/**
 * @public
 *
 * This component is used to configure  where the player will spawn, initially, in the game. Use the studio to configure the spawn for the space.
 *
 * This is a singleton component.
 */
export class SpawnComponent extends Component3D<any> {
  /**
   * @internal
   */
  _avatar: any;

  /**
   * @internal
   */
  _url: string = "";

  async init() {
    //
    this._updateTransform();

    Camera.current.position.copy(this.position);

    Camera.current.quaternion.copy(this.quaternion);

    await this._createAvatar();

    this._update3D();
  }

  _tmpEuler = new Euler(0, 0, 0, "YXZ");

  _getAvatarRotation() {
    //
    this._tmpEuler.setFromQuaternion(this.quaternion);

    return {
      x: this._tmpEuler.x,
      y: this._tmpEuler.y,
      z: this._tmpEuler.z,
    };
  }

  private async _createAvatar() {
    //
    return;
    const useUserAvatar = this.opts.space.options.signals?.userAvatar$
      ? this.data.useUserAvatar
      : false;

    var customData = {};

    if (IS_EDIT_MODE != true) {
      const scriptFactory = this.opts.space.resources.scriptFactory;

      // @ts-ignore
      const player = scriptFactory.imports["@oo/scripting"].Player;

      customData = player?.avatarData ?? {};
    }

    if (!useUserAvatar && this.data.defaultAvatar?.url) {
      //
      this._url = this.data.defaultAvatar?.url;
    }

    var data: any = {
      type: "avatar",
      position: this.data.position,
      rotation: this._getAvatarRotation(),
      scale: this.data.scale,
      useMixer: this.data.useMixer,
      renderMode: this.data.renderMode,
      plugins: this.data.plugins || [],
      main: true,
      url: "",
      useUserAvatar,
      collider: {
        enabled: true,
        rigidbodyType: "PLAYER",
        type: "CAPSULE",
        groups: [3 /** GROUPS.PLAYERS */],
      },
    };

    if (__BUILD_TARGET__ !== "web") {
      //
      data.main = false;
      data.useUserAvatar = false;
      data.collider = { enabled: false };
    }

    Object.assign(data, customData);

    data.url = this._url;
    data.useUserAvatar = useUserAvatar;

    this._avatar = (await this.space.components.create(data, {
      transient: true,
    })) as any;

    Object.defineProperty(this._avatar, "behaviors", {
      get: () => this.behaviors,
    });

    Object.defineProperty(this._avatar, "childComponents", {
      get: () => this.childComponents,
    });
  }

  /**
   * @internal
   */
  _updateTransform() {
    //
    const { position, rotation, scale } = this.data;

    this.position.set(position.x, position.y, position.z);

    this.rotation.set(rotation.x, rotation.y, rotation.z);
  }

  private _update3D() {
    //
    this._updateTransform();

    this._avatar?._dataWrapper.assign({
      position: this.data.position,
      rotation: this._getAvatarRotation(),
      scale: this.data.scale,
      useMixer: this.data.useMixer,
      renderMode: this.data.renderMode,
      useUserAvatar: this.data.useUserAvatar,
      url: this._url,
    });
  }

  /**
   * @internal
   */
  onDataChange(opts: DataChangeOpts): void {
    this._update3D();
  }

  protected dispose() {
    this._avatar?.destroy();
  }
}
