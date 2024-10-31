// @ts-check
var vertices = require("./lib/vertices");

import createLayout from "./layout-bmfont-text.js";
import buffer from "./lib/three-buffer-vertex-data";

import { BufferGeometry } from "three";

var CW = [0, 2, 3];
// var CCW = [2, 1, 3]

function createIndices(count) {
  /**
     * {
            clockwise: true,
            type: "uint16",
            count: glyphs.length,
        }
     */

  var start = 0;

  var dir = CW,
    a = dir[0],
    b = dir[1],
    c = dir[2];

  var numIndices = count * 6;

  var indices = new Uint16Array(numIndices);
  for (var i = 0, j = 0; i < numIndices; i += 6, j += 4) {
    var x = i + start;
    indices[x + 0] = j + 0;
    indices[x + 1] = j + 1;
    indices[x + 2] = j + 2;
    indices[x + 3] = j + a;
    indices[x + 4] = j + b;
    indices[x + 5] = j + c;
  }
  return indices;
}

export default class TextGeometry extends BufferGeometry {
  constructor(opt) {
    super();

    if (typeof opt === "string") {
      opt = {
        text: opt,
      };
    }

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

    this.layout = createLayout(opt);

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
    var positions = vertices.positions(glyphs);
    var uvs = vertices.uvs(glyphs, texWidth, texHeight, flipY);

    var indices = createIndices(glyphs.length);

    var concat = [];
    var cols = [];

    var i = 0;

    while (i < positions.length * 0.5) {
      concat.push(opt.global_text_scale * positions[i * 2]);
      concat.push(opt.global_text_scale * -positions[i * 2 + 1]);
      concat.push(0);
      cols.push(opt.color[0], opt.color[1], opt.color[2]);
      i++;
    }

    // update vertex data
    buffer.index(this, indices, 1, "uint16");
    buffer.attr(this, "position", new Float32Array(concat), 3);
    buffer.attr(this, "color", new Float32Array(cols), 3);
    buffer.attr(this, "uv", new Float32Array(uvs), 2);

    // update multipage data
    if (!opt.multipage && "page" in this.attributes) {
      // disable multipage rendering
      // @ts-ignore
      this.removeAttribute("page");
    } else if (opt.multipage) {
      var pages = vertices.pages(glyphs);
      // enable multipage rendering
      buffer.attr(this, "page", pages, 1);
    }
  }
}
