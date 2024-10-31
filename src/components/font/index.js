import TextGeometry from "./bmfont";

import FontWrapper from "./wrapper.js";

import MSDFMaterial from "./material.js";

import {
  GLOBAL_TEXT_SCALE,
  SET_FONT_DISTANCE_RANGE_FIELD,
} from "engine/constants";

import { LinearFilter } from "three";

// import MultiTextWrapper from './multitextwrapper.js'

var DEFAULT_OPTS = {
  text: "DEFAULT",

  color: [1, 1, 1],

  align: "center",

  verticalalign: "center",

  font: "aeonik-bold",

  scale: { x: 1, y: 1, z: 1 },

  light: false,

  width: 500,

  // lineHeight: 77,

  screenSized: false,

  instanced: false,

  instancedBillBoard: true,

  // mode: 'pre',

  global_text_scale: GLOBAL_TEXT_SCALE,
};

import Loader from "engine/loader";

import DATA from "./data.js";

import FontInstancedMesh from "./instanced/mesh.js";

import FontInstancedWrapper from "./instanced/wrapper.js";

import Scene from "engine/scene";
import { Object3D } from "three";

const instancedSuffix = "_instanced";
const instancedBillBoardSuffix = "_billboard";

let fontCache = new Map();

let meshCache = new Map();

class FontMeshFactory {
  constructor() {
    this.instancedFontContainer = new Object3D();

    this.instancedFontContainer.matrixWorldAutoUpdate = false;

    this.instances = [];

    this.instancedFonts = [];

    this.promises = {};

    this.instancedMeshes = [];

    Scene.add(this.instancedFontContainer);

    // globalThis.FontMeshFactory = this;
  }

  async loadFont(n, instanced = false, instancedBillBoard = false) {
    var name = n;

    if (instanced == true) {
      name += instancedSuffix;

      if (instancedBillBoard) {
        name += instancedBillBoardSuffix;
      }
    }

    if (this.promises[name] != null) {
      return this.promises[name];
    }

    const p = new Promise((resolve) => {
      const fontData = DATA[n];

      var ps = [];

      ps.push(Loader.loadTexture(fontData.tex));

      ps.push(Loader.loadJson(fontData.json));

      Promise.all(ps).then((res) => {
        const tex = res[0];

        tex.generateMipmaps = false;

        tex.magFilter = tex.minFilter = LinearFilter;

        tex.needsUpdate = true;

        const json = res[1];

        SET_FONT_DISTANCE_RANGE_FIELD(json.distanceField.distanceRange);

        fontCache.set(name, {
          material: new MSDFMaterial({
            map: tex,
            instanced: instanced,
            billboard: instancedBillBoard,
          }),

          font: json,
        });

        resolve();
      });
    });

    this.promises[name] = p;

    return p;
  }

  async get(opts) {
    var defaultopts = Object.assign({}, DEFAULT_OPTS);

    var options = Object.assign(defaultopts, opts);

    let args = Object.assign({}, options);

    if (args.instanced == true) {
      var name = args.font + instancedSuffix;

      if (args.instancedBillBoard) {
        name += instancedBillBoardSuffix;
      }

      if (fontCache.get(name) == null) {
        await this.loadFont(args.font, args.instanced, args.instancedBillBoard);
      }

      var font = fontCache.get(name);

      args.font = font.font;

      if (meshCache.get(name) == null) {
        const mesh = new FontInstancedMesh(font);

        meshCache.set(name, mesh);

        this.instancedFontContainer.add(mesh);

        this.instancedMeshes.push(mesh);
      }

      const wrapper = new FontInstancedWrapper(meshCache.get(name), args);

      this.instances.push(wrapper);

      return wrapper;
    } else {
      if (fontCache.get(args.font) == null) {
        await this.loadFont(args.font, args.instanced);
      }

      args.font = fontCache.get(args.font).font;

      let geo = new TextGeometry(args);

      let font = options.font;

      let mat = fontCache.get(font).material;

      mat.uniforms = fontCache.get(font).material.uniforms;

      const text = this.getTransformedText(opts.text, opts.textTransform);

      const wrapper = new FontWrapper(geo, mat, text, options);

      this.instances.push(wrapper);

      return wrapper;
    }
  }

  createMultiText(opts) {
    var options = Object.assign({}, opts);

    let args = Object.assign({}, options);

    if (datas.get(args.font) == null) {
      this.loadFont(args.font);
    }

    args.font = datas.get(args.font).font;

    let font = options.font;

    let mat = datas.get(font).material;

    mat.uniforms = datas.get(font).material.uniforms;

    return new MultiTextWrapper(mat, args);
  }

  /**
   *
   * @param {string} text
   * @param {import('@uitypes/Asset').TextTransform} transform
   */
  getTransformedText(text, transform) {
    if (!text) return text;

    if (transform === "uppercase") {
      return text.toUpperCase();
    }

    if (transform === "lowercase") {
      return text.toLowerCase();
    }

    if (transform === "capitalize") {
      return text.replace(/\b\w/g, (l) => l.toUpperCase());
    }

    if (transform === "togglecase") {
      return text
        .split("")
        .map((c) => (c.toUpperCase() == c ? c.toLowerCase() : c.toUpperCase()))
        .join("");
    }

    return text;
  }

  // dispose(input) {
  //     // dont destroy materials

  //     var text = input.children[0];

  //     if (text.parent) {
  //         text.parent.remove(text);
  //     }

  //     text.geometry.dispose();

  //     text.geometry = null;

  //     text = null;
  // }

  disposeAll() {
    let i = 0;

    while (i < this.instances.length) {
      this.dispose(this.instances[i]);

      if (this.instances[i].parent) {
        this.instances[i].parent.remove(this.instances[i]);
      }

      i++;
    }

    this.instances = [];
  }

  dispose() {
    let i = 0;

    while (i < this.instancedMeshes.length) {
      this.instancedMeshes[i].dispose();

      this.instancedMeshes[i].geometry.dispose();

      this.instancedMeshes[i].geometry = null;

      this.instancedFontContainer.remove(this.instancedMeshes[i]);

      i++;
    }

    this.instancedMeshes = [];

    meshCache = new Map();
  }
}

export default new FontMeshFactory();
