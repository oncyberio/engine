import TextGeometry from "./bmfont/";

import { Mesh, BufferGeometry } from "three";

import { GLOBAL_TEXT_SCALE } from "engine/constants";

import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";

var DEFAULT_OPTS = {
  text: "DEFAULT",

  color: [1, 1, 1],

  align: "center",

  font: "aeonik-bold",

  lineHeight: 0,

  scale: 1,

  light: false,

  global_text_scale: GLOBAL_TEXT_SCALE,
};

export default class MultiText extends Mesh {
  constructor(material, options) {
    super(new BufferGeometry(), material);

    this.font = options.font;

    this.count = -1;

    this.elements = [];

    this.geos = [];
  }

  add(opt) {
    this.count++;

    var id = this.count;

    var defaultopts = Object.assign({}, DEFAULT_OPTS);

    var options = Object.assign(defaultopts, opt);

    options.font = this.font;

    const geo = new TextGeometry(options);

    this.elements.push({
      geometry: geo,

      position: options.position,

      options: options,

      update: () => {
        this.update(id);
      },
    });

    this.geos.push(geo);

    this.update(this.count);

    return this.elements[this.count];
  }

  get(id) {
    return this.elements[id];
  }

  update(id) {
    const geo = this.elements[id].geometry;

    const options = this.elements[id].options;

    geo.update({
      text: options.text,
    });

    geo.center();

    if (options.mode == null) {
      options.mode = {};
    }

    if (options.mode.LEFT == true) {
      geo.computeBoundingBox();

      geo.translate(-geo.boundingBox.min.x, 0, 0);
    } else if (options.mode.RIGHT == true) {
      geo.computeBoundingBox();

      geo.translate(geo.boundingBox.min.x, 0, 0);
    }

    if (options.mode.BOTTOM == true) {
      geo.computeBoundingBox();

      geo.translate(0, -geo.boundingBox.min.y, 0);
    } else if (options.mode.TOP == true) {
      geo.computeBoundingBox();

      geo.translate(0, geo.boundingBox.min.y, 0);
    }

    geo.translate(
      options.position[0],

      options.position[1],

      options.position[2]
    );

    this.render();
  }

  alignToTheRightOf(origin, anchor, padding = 0, debug = false) {
    anchor.geometry.computeBoundingBox();

    let width =
      anchor.geometry.boundingBox.max.x - anchor.geometry.boundingBox.min.x;

    const x =
      anchor.options?.position[0] != null
        ? anchor.options.position[0]
        : anchor.position.x;

    origin.options.position[0] = x + width + padding;

    origin.update();
  }

  alignToTheBottomOf(origin, anchor, padding = 0) {
    anchor.geometry.computeBoundingBox();

    let height =
      anchor.geometry.boundingBox.max.y - anchor.geometry.boundingBox.min.y;

    const y =
      anchor.options?.position[1] != null
        ? anchor.options.position[1]
        : anchor.position.y;

    origin.options.position[1] = y - height - padding;

    origin.update();
  }

  render() {
    if (this.geometry) {
      this.oldGeometry = this.geometry;
    }

    this.geometry = BufferGeometryUtils.mergeBufferGeometries(
      this.geos,

      false
    );

    if (this.oldGeometry) {
      this.oldGeometry.dispose();

      this.oldGeometry = null;
    }

    this.geometry.needsUpdate = true;
  }
}
