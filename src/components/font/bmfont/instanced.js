// @ts-check
var vertices = require("./lib/vertices");

import createLayout from "./layout-bmfont-text.js";
import buffer from "./lib/three-buffer-vertex-data";

import { BufferGeometry } from "three";

var CW = [0, 2, 3];

export default class InstancedTextData {
  constructor(opt) {
    if (typeof opt === "string") {
      opt = {
        text: opt,
      };
    }

    this.uvs = [];

    this.sizes = [];

    this._opt = Object.assign({}, opt);

    if (opt) this.update(opt);
  }

  update(opt) {
    if (typeof opt === "string") {
      opt = {
        text: opt,
      };
    }

    // use constructor defaults
    opt = Object.assign({}, this._opt, opt);

    if (!opt.font) {
      throw new TypeError("must specify a { font } in options");
    }

    let align = opt.align;

    // opt.align = null

    this.layout = createLayout(opt);

    opt.align = align;

    // get vec2 texcoords
    var flipY = opt.flipY !== true;

    // the desired BMFont data
    var font = opt.font;

    // determine texture size from font file
    var texWidth = font.common.scaleW;
    var texHeight = font.common.scaleH;

    // get visible glyphs
    var glyphs = this.layout.glyphs.filter(function (glyph) {
      var bitmap = glyph.data;
      return bitmap.width * bitmap.height > 0;
    });

    // provide visible glyphs for convenience
    this.visibleGlyphs = glyphs;

    // get common vertex data
    this.sizes = vertices.sizes(glyphs, opt.global_text_scale, opt.align, true);

    this.uvs = vertices.separateuvs(glyphs, texWidth, texHeight, flipY);
  }
}
