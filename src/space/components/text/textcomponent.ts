// @ts-check
import { Component3D, DataChangeOpts } from "engine/abstract/component3D";
import FontMeshFactory from "engine/components/font";
import { Color, MeshBasicMaterial } from "three";
import { FontFamily, TextAlignment, TextComponentData } from "./textdata";
import FontMeshWrapper from "engine/components/font/instanced/wrapper";
import FontWrapper from "engine/components/font/wrapper";
import { Param } from "engine/space/params";

export type { TextComponentData } from "./textdata";

const threeColor = new Color();

function toThreeColor(color) {
  threeColor.set(color);

  return [threeColor.r, threeColor.g, threeColor.b];
}

/**
 * @public
 *
 * Text component, used to display text in the game.
 *
 * See {@link TextComponentData} for the data schema used to create a text component
 */
export class TextComponent extends Component3D<TextComponentData> {
  //
  private _font: FontWrapper | FontMeshWrapper = null;

  private _regenerate = false;

  private _isInstanced(
    font: FontWrapper | FontMeshWrapper
  ): font is FontMeshWrapper {
    return this.data.instanced;
  }

  protected async init() {
    if (this.data.instanced) {
      const fontParams = this._getFontParams();

      this._font = await FontMeshFactory.get(fontParams);

      // instanced
      if (this._isInstanced(this._font)) {
        this._font.attachTo(this);
      } else {
        this.add(this._font);
        this._font.name = "fontmesh";
      }

      this._update3D();
    } else {
      this._regenerate = true;

      await this._update3D();
    }
    //
  }

  private async _createFont() {
    //
    const fontParams = this._getFontParams();

    const font = await FontMeshFactory.get(fontParams);

    if (this._font) {
      this._disposeFont();
    }

    this._font = font;

    if (this._isInstanced(this._font)) {
      this._font.attachTo(this);
    } else {
      this.add(this._font);
      this._font.name = "fontmesh";
    }
  }

  private _disposeFont() {
    //
    this.remove(this._font);

    this._font.dispose();

    this._font = null;
  }

  private update(opts = {}) {
    this._font.update(opts);
  }

  private _getFontParams() {
    return {
      opacity: this.data.opacity ? this.data.opacity : 1,
      font: this.data.font,
      text: this.data.text,
      width: this.data.width,
      align: this.data.align,
      lineHeight: this.data.lineHeight,
      textTransform: this.data.textTransform,
      scale: { x: 1, y: 1, z: 1 },
      color: toThreeColor(this.data.textColor),
      instanced: this.data.instanced ? true : false,
    };
  }

  /**
   * @internal
   */
  onDataChange(opts: DataChangeOpts<TextComponentData>): void {
    // TODO : Add text edition & others
    if (opts.prev.font !== this.data.font) {
      //
      this._regenerate = true;
    }

    this._update3D(opts);
  }

  private _isUpdating = false;

  private async _update3D(opts?: DataChangeOpts<TextComponentData>) {
    const isProgress = opts?.isProgress;
    //
    if (this._isInstanced(this._font)) {
      //
      this._font.opacity = this.data.opacity;

      this._font.color = toThreeColor(this.data.textColor);
      //
    } else {
      if (this._isUpdating) {
        return;
      }

      if (this._regenerate && !isProgress) {
        //
        this._isUpdating = true;

        this._regenerate = false;

        await this._createFont();

        this._isUpdating = false;
      }

      if (opts?.prev.opacity !== this.data.opacity) {
        this._font.alpha = this.data.opacity;
      }

      if (opts?.prev.textColor !== this.data.textColor) {
        this._font.color = toThreeColor(this.data.textColor);
      }

      if (
        opts?.prev.width !== this.data.width ||
        opts?.prev.align !== this.data.align ||
        opts?.prev.lineHeight !== this.data.lineHeight
      ) {
        this._font.updateStyle({
          width: this.data.width,
          align: this.data.align,
          lineHeight: this.data.lineHeight,
        });
      }

      if (
        opts?.prev.textTransform !== this.data.textTransform ||
        opts?.prev.text !== this.data.text
      ) {
        this.update({
          text: this.data.text,
          textTransform: this.data.textTransform,
        });
      }
    }
  }

  /**
   * @internal
   */
  getCollisionMesh() {
    //
    return this._font.mesh;
  }

  protected dispose() {
    //
    this._disposeFont();

    super.dispose();
  }

  /**
   * Public api
   */

  /**
   * Text to display
   */
  @Param() text = "";

  /**
   * Font to use
   */
  @Param() font: FontFamily = "aeonik-bold";

  /**
   * Width of the text box. Defaults to 500. Use this to avoid breaking a long into multiple lines
   */
  @Param() width = 500;

  /**
   * Line height of the text. Defaults to 60
   */
  @Param() lineHeight = 60;

  /**
   * Color of the text. Defaults to "#ffffff"
   */
  @Param() textColor = "#ffffff";

  /**
   * How text should be aligned. Defaults to "left"
   */
  @Param() align: TextAlignment = "left";

  /**
   * Optional transform to apply to the text. Defaults to "none"
   */
  @Param() textTransform = "none";

  /**
   * Opacity of the text. Defaults to 1
   */
  @Param() opacity = 1;
}
