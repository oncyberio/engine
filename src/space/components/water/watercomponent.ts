// @ts-check

import { Component3D, DataChangeOpts } from "engine/abstract/component3D";
import WaterFactory from "engine/components/water";
import { WaterComponentData } from "./waterdata";

/**
 * @public
 *
 * Water component, used to display water in the game. Use the studio to add a water component to the space.
 *
 * This is a singleton component, so you can only have one water component in the game. For performance reasons
 * Adding both a water and a reflector component to the same space is not supported.
 */
export class WaterComponent extends Component3D<WaterComponentData> {
  private _water = null;

  protected async init() {
    //
    this._water = WaterFactory.get({
      ...this.data,
      position: { x: 0, y: 0, z: 0 },
    });

    this.add(this._water);

    this._update3D();
  }

  /**
   * @internal
   */
  syncWithTransform(isProgress = false) {
    //
    this._assignXYZ("position", this.position);

    this._assignXYZ("rotation", this.rotation);
  }

  /**
   * @internal
   */
  onDataChange(opts: DataChangeOpts): void {
    this._update3D();
  }

  private _update3D() {
    //
    this.position.copy(this.data.position as any);

    this._water.scale.x = this.data.scale.x;

    this._water.scale.y = this.data.scale.z;

    this._water.opacity = this.data.opacity;

    this._water.color = this.data.color;
  }

  /**
   * @internal
   */
  getCollisionMesh() {
    return this._water;
  }

  protected dispose() {
    this.remove(this._water);

    this._water.dispose();
  }
}
