// @ts-check

import { Object3D } from "three";

import { GLOBAL_TEXT_SCALE, DEBUG_BOX } from "engine/constants";

const CENTER = "CENTER";

const LEFT = "LEFT";

const RIGHT = "RIGHT";

const TOP = "TOP";

const BOTTOM = "BOTTOM";

import Scene from "engine/scene";

var MODE = {
  CENTER: true,
  BILLBOARD: false,
  FIXED_SIZE: false,
  FONT_SIZE: 10,
  BOTTOM: false,
  LEFT: false,
  RIGHT: false,
  TOP: false,
  STICK_UNDER: false,
};

import DebugBoxFactory from "engine/components/debugbox";

const SPACE_ID = " ".charCodeAt(0);

// const GLITCH_SPEED 			 = 0.05
const GLITCH_SPEED = 0.015;

const GLITCH_THROTTLE_FRAMES = 2;

const GLITCH_BACK_THROTTLE = Math.round(GLITCH_THROTTLE_FRAMES * 0);

const GLITCH_RANDOM_START_STRING_SLICE = 2;

const GLITCH_RANDOM_MAX_STRING_LIMIT = 15;

String.prototype.replaceAt = function (index, char) {
  var a = this.split("");
  a[index] = char;
  return a.join("");
};

const PLACEHOLDER_STYLE = {
  color: [1, 1, 1],

  text: "Add text...",

  alpha: 0.5,
};

import PipeLineMesh from "engine/abstract/pipelinemesh";
import mediator from "engine/events/mediator";

export default class FontWrapper extends Object3D {
  constructor(geo, material, text, options) {
    super();

    this.options = options;

    // this.options.invScale = 1 / (this.options.scale * GLOBAL_TEXT_SCALE);

    this.originalScale = this.options.scale;

    // this.scale.set(
    //     this.options.scale.x,
    //     this.options.scale.y,
    //     this.options.scale.z
    // );

    this.geometry = geo;

    this.mesh = new PipeLineMesh(this.geometry, material, {
      occlusionMaterial: material.occlusionMaterial,
    });

    //this.mesh.customDepthMaterial = material.customDepthMaterial

    //this.mesh.castShadow = true

    this._alpha = this.mesh._alpha = 1;

    // this.raycastMesh = new Mesh(
    //     new BoxGeometry(1, 1, 1),
    // )

    this.mesh.rendermodes = {
      CENTER: MODE.CENTER,
      LEFT: MODE.LEFT,
      TOP: MODE.TOP,
      BOTTOM: MODE.BOTTOM,
      BILLBOARD: MODE.BILLBOARD,
      FIXED_SIZE: MODE.FIXED_SIZE,
      FONT_SIZE: MODE.FONT_SIZE,
      STICK_UNDER: MODE.STICK_UNDER,
    };

    this.add(this.mesh);

    this.text = text;

    if (DEBUG_BOX) {
      this.box = DebugBoxFactory.getBox(this.mesh);

      Scene.add(this.box);
    }

    this.update();

    // this.resize()

    this.mesh.onBeforeRender = () => {
      let needsUpdate = true;

      if (this.mesh.material.uniforms.alpha.value != this._alpha) {
        this.mesh.material.uniforms.alpha.value = this._alpha;

        needsUpdate = true;
      }

      this.mesh.material.uniformsNeedUpdate = needsUpdate;
    };

    // this.mesh.castShadow = true
  }

  setAnchor(side, value = true) {
    if (this.mesh.rendermodes[side] == null) {
      console.warn("null font render mode ? ");
    }

    this.mesh.rendermodes[side] = value;

    this.update();
  }

  setWidth(val) {
    this.geometry._opt.width = val;
  }

  setFontSize(val) {
    this.mesh.rendermodes.FONT_SIZE = val;
  }

  updateStyle(opts = {}) {
    if (opts.color && !this.arrayIsEqual(this.color, opts.color)) {
      this.color = opts.color;
    }

    if (opts.scale && this.geometry._opt.scale != opts.scale) {
      this.geometry._opt.scale = opts.scale;

      // this.originalScale 	  = opts.scale

      this.options.scale = opts.scale;

      // this.options.invScale =
      //     1 / (this.options.scale * GLOBAL_TEXT_SCALE);
    }

    if (opts.width && this.geometry.layout.width != opts.width) {
      this.options.width = opts.width;

      this.geometry._opt.width = opts.width;
    }

    if (opts.align && this.geometry._opt.align != opts.align) {
      this.options.align = opts.align;

      this.geometry._opt.align = opts.align;
    }

    if (opts.lineHeight && this.geometry._opt.lineHeight != opts.lineHeight) {
      this.options.lineHeight = opts.lineHeight;

      this.geometry._opt.lineHeight = opts.lineHeight;
    }

    this.update(this.text);
  }

  update(opts = {}) {
    var text = opts.text;

    if (this.mesh == null) {
      return;
    }

    if (text == null) {
      text = this.text;
    }

    const isNotEmpty = text != "";

    const transformedText = this.getTransformedText(text, opts.textTransform);

    this.mesh.geometry.update(
      isNotEmpty ? transformedText : PLACEHOLDER_STYLE.text
    );

    this.mesh._alpha = isNotEmpty ? this.alpha : PLACEHOLDER_STYLE.alpha;

    if (this.mesh.rendermodes.CENTER) {
      this.mesh.geometry.center();
    }

    if (this.mesh.rendermodes.LEFT) {
      this.stickto(LEFT);
    }

    if (opts.verticalalign == "top" || this.mesh.rendermodes.TOP == true) {
      this.stickto(TOP);
    }

    if (this.mesh.rendermodes.RIGHT) {
      this.stickto(RIGHT);
    }

    if (opts.verticalalign == "bottom" || this.mesh.rendermodes.BOTTOM) {
      this.stickto(BOTTOM);
    }

    // if(this.mesh.rendermodes.BILLBOARD ){

    // 	let mesh = this.mesh

    // 	this.mesh.onBeforeRender = ()=>{

    // 		mesh.quaternion.copy(camera.quaternion)

    // 	}
    // }

    if (this.mesh.rendermodes.STICK_UNDER != false) {
      let anchor = this.mesh.rendermodes.STICK_UNDER;

      anchor.geometry.computeBoundingBox();

      let boundingAbove = anchor.geometry.boundingBox;

      let height =
        anchor.geometry.boundingBox.max.y - anchor.geometry.boundingBox.min.y;

      this.position.y = anchor.position.y - height;
    }

    this.text = text;

    this.updateDebug();
  }

  resize() {
    // this.updateStyle({
    // 	scale: GROW_FONT_SCALE * this.originalScale
    // })
    // // if(this.mesh.rendermodes.FIXED_SIZE){
    // 	let s = (FOV_RATIO_PX.h * this.mesh.rendermodes.FONT_SIZE) / ORIGINAL_FONT_SIZE
    // 	this.mesh.scale.set(s,s, 1.0)
    // }
  }

  stickto(side = TOP) {
    this.mesh.geometry.computeBoundingBox();

    if (side == TOP) {
      this.mesh.geometry.translate(0, this.mesh.geometry.boundingBox.min.y, 0);
    }

    if (side == BOTTOM) {
      this.mesh.geometry.translate(0, -this.mesh.geometry.boundingBox.min.y, 0);
    }

    if (side == LEFT) {
      this.mesh.geometry.translate(-this.mesh.geometry.boundingBox.min.x, 0, 0);
    }

    if (side == RIGHT) {
      this.mesh.geometry.translate(this.mesh.geometry.boundingBox.min.x, 0, 0);
    }
  }

  updateDebug() {
    if (DEBUG_BOX) {
      this.box.update();
    }
  }

  show() {
    return new Promise((resolve, reject) => {
      resolve();
    });
  }

  hide() {
    return new Promise((resolve, reject) => {
      resolve();
    });
  }

  getLastCharacter() {
    let space = this.getWhitespace();

    let addSpace = this.isLastSpace(this.text) ? space : 0;

    let lastLetterBound = this.getLastLetterBounds();

    let box = {
      x: lastLetterBound.max.x + addSpace,

      y:
        lastLetterBound.min.y +
        (lastLetterBound.max.y - lastLetterBound.min.y) * 0.5,
    };

    return box;
  }

  dispose = () => {
    return new Promise((resolve, reject) => {
      try {
        if (DEBUG_BOX) {
          DebugBoxFactory.destroy(this.box);
        }

        //this.removeEvents()

        this.mesh.destroy?.();

        this.mesh.geometry.dispose();

        this.mesh.geometry = null;

        this.mesh = null;
      } catch (e) {
        console.log("API :", e);
      }

      resolve();
    });
  };

  get lineHeight() {
    return this.options.lineHeight;
  }

  set lineHeight(val) {}

  get truescale() {
    return this.options.scale * GLOBAL_TEXT_SCALE;
  }

  set truescale(val) {}

  get color() {
    return this.geometry._opt.color;
  }

  set color(val) {
    this.geometry._opt.color = val;
  }

  set alpha(val) {
    this._alpha = val;
  }

  get alpha() {
    return this._alpha;
  }

  glitch(text = null) {
    if (text != null) {
      this.text = text;
    }

    this._upGlitch = true;

    this._originGlitchText = this.text;

    this._glitchCountLimit = this.text.length;

    this._whiteSpaceIndexes = this.getWhiteSpaceIndexes(this.text);

    this._glitchCount = 0;

    this._backThrottle = 0;

    this.renderGlitch();
  }

  renderGlitch() {
    if (this._upGlitch) {
      let progress = Math.min(this._glitchCount, this._originGlitchText.length);

      let str = this.randomString(progress);

      this.update(this.replaceWhiteSpaceIndexes(this._whiteSpaceIndexes, str));

      this._glitchCount++;

      if (this._glitchCount > progress + GLITCH_THROTTLE_FRAMES) {
        this._glitchCount = 0;

        this._upGlitch = false;
      }

      this.glitchTimer = mediator.delayedCall(
        GLITCH_SPEED,
        this.renderGlitch.bind(this)
      );
    } else {
      if (this._glitchCount < this._originGlitchText.length + 1) {
        let progress = this._glitchCount;

        let glitchStr = this.randomString(this._originGlitchText.length);

        let finalStr = this._originGlitchText.slice(0, progress);

        finalStr += glitchStr.slice(progress, glitchStr.length);

        this.update(
          this.replaceWhiteSpaceIndexes(this._whiteSpaceIndexes, finalStr)
        );

        this.glitchTimer = mediator.delayedCall(
          GLITCH_SPEED,
          this.renderGlitch.bind(this)
        );

        // if( this._backThrottle % GLITCH_BACK_THROTTLE == 0 ){

        this._glitchCount++;

        // }

        // this._backThrottle++
      } else {
        this.update(this._originGlitchText);
      }
    }
  }

  replaceWhiteSpaceIndexes(wsi, nStr) {
    let res = nStr;

    let i = 0;

    let cIndex = -1;

    while (i < wsi.length) {
      cIndex = wsi[i];

      if (cIndex < res.length) {
        res = res.replaceAt(cIndex, " ");
      }

      i++;
    }

    return res;
  }

  replaceStringAt(string, index, replace) {
    // console.log(string, index)

    return string.substring(0, index) + replace + string.substring(index + 1);
  }

  getWhiteSpaceIndexes(str) {
    let index = 0;

    let res = [];

    while ((index = str.indexOf(" ", index + 1)) > 0) {
      res.push(index);
    }

    return res;
  }

  randomString(count) {
    let str = "";

    let i = 0;

    let max = Math.ceil(
      Math.max(count, 1) /
        (GLITCH_RANDOM_MAX_STRING_LIMIT - GLITCH_RANDOM_START_STRING_SLICE)
    );

    while (i < max) {
      str += Math.random().toString(36).slice(
        GLITCH_RANDOM_START_STRING_SLICE,

        GLITCH_RANDOM_MAX_STRING_LIMIT
      );

      i++;
    }

    return str.slice(0, count).toUpperCase();
  }

  arrayIsEqual = (a1, a2) => {
    var i = a1.length;
    while (i--) {
      if (a1[i] !== a2[i]) return false;
    }
    return true;
  };

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

  // onMirror(val){

  // 	this.visible = !val
  // }
}
