import { Component3D, DataChangeOpts } from "engine/abstract/component3D";
import LightFactory from "engine/components/lighting";
import { SET_SHADOW_NEEDS_UPDATE } from "engine/constants";
import { Param } from "engine/space/params";
import { Vector3 } from "three";

/**
 * @public
 *
 * This component is used to controls lighting in the game. Use the studio to configure the lighting for the space.
 *
 * This is a singleton component. You can only have one lighting in the game.
 */
export class LightingComponent extends Component3D<any> {
  //
  protected async init() {
    //
    const lighting = LightFactory.get(this.data, this.space);

    this.space.lighting = lighting;

    this._update3D();
  }

  private tmpDir = new Vector3();

  /**
   * @internal
   */
  getTransformData() {
    return {
      lightPosition: this.data.lightPosition,
      lightDirection: this.data.lightDirection,
    };
  }

  /**
   * @internal
   */
  syncWithTransform(isProgress = false) {
    //
    this.getWorldDirection(this.tmpDir);

    const lightPosition = {
      x: this.position.x,
      y: this.position.y,
      z: this.position.z,
    };

    const lightDirection = {
      x: this.tmpDir.x,
      y: this.tmpDir.y,
      z: this.tmpDir.z,
    };

    this._dataWrapper.set("lightPosition", lightPosition);

    this._dataWrapper.set("lightDirection", lightDirection);
  }

  /**
   * @internal
   */
  onDataChange(opts: DataChangeOpts): void {
    this._update3D();
  }

  private _update3D(isProgress = false) {
    //
    this.position.copy(this.data.lightPosition);

    this.tmpDir.copy(this.data.lightDirection).normalize();

    this.lookAt(this.tmpDir.add(this.position));

    this.space.lighting.opts = this.data;

    if (!isProgress) {
      SET_SHADOW_NEEDS_UPDATE(true);
    }
  }

  /**
   * @internal
   */
  get needsRender() {
    return this.space.lighting.needsRender;
  }

  /**
   * @internal
   */
  set needsRender(value) {
    this.space.lighting.needsRender = value;
  }

  protected dispose() {
    this.opts.space.lighting = null;
  }
}
