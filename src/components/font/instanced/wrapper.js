import { Object3D, Vector3, Sphere } from "three";

import InstancedTextData from "../bmfont/instanced.js";

import Renderer from "engine/renderer";

export default class FontMeshWrapper {
  constructor(mesh, args) {
    // super()

    this.sphere = new Sphere();

    this.args = args;

    this.mesh = mesh;

    this.name = "instance_font_wrapper";

    this.wrappers = [];

    this._opacity = 1;

    this._position = new Vector3();

    this._visible = true;

    this._scale = 1;

    this._size = {
      center: new Vector3(),
      x: {
        min: 0,
        max: 0,
      },
      y: {
        min: 0,
        max: 0,
      },
    };

    this.frame = Renderer.info.render.manualFrame;

    this.frustumTested = false;

    // debugger;

    this.update(args);
  }

  update(args) {
    if (typeof args === "string") {
      args = Object.assign({}, this.args, { text: args });
    } else {
      args = Object.assign({}, this.args);
    }

    if (args.text == null) {
      return;
    }

    let textData = new InstancedTextData(args);

    this.data = textData;

    this.dispose();

    let i = 0;

    let size = {
      w: 0,
      h: 0,
    };

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    // debugger;

    while (i < this.data.sizes.length) {
      const sizes = this.data.sizes[i];

      const uvs = this.data.uvs[i];

      const wrapper = this.mesh.add({
        customFrustumTest: this.customFrustumTest.bind(this),
      });

      wrapper.font_uv = uvs;
      wrapper.char_offset = [sizes.offset.x, sizes.offset.y, 0];
      wrapper.char_scale = [sizes.size.x, sizes.size.y, 0];
      wrapper.color = args.color;
      wrapper.scale = args.scale;

      this.wrappers.push(wrapper);

      minX = Math.min(minX, sizes.offset.x - sizes.size.x);
      maxX = Math.max(maxX, sizes.offset.x + sizes.size.x);
      minY = Math.min(minY, sizes.offset.y - sizes.size.y);
      maxY = Math.max(maxY, sizes.offset.y + sizes.size.y);

      i++;
    }

    const center = new Vector3((minX + maxX) / 2, (minY + maxY) / 2, 0);

    this.size = {
      center: center,

      x: {
        min: minX,
        max: maxX,
      },
      y: {
        min: minY,
        max: maxY,
      },
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  customFrustumTest(frustum) {
    if (this.frame != Renderer.info.render.manualFrame) {
      try {
        if (this.source) {
          this.sphere.radius =
            Math.max(this.size.width, this.size.height) *
            Math.max(
              this.source.scale.x,
              this.source.scale.y,
              this.source.scale.z
            );

          this.sphere.center.copy(this.source.position);
        } else {
          this.sphere.radius = Math.max(this.size.width, this.size.height);

          this.sphere.center.copy(this.position);
        }

        this.frustumTested = frustum.intersectsSphere(this.sphere);

        this.frame = Renderer.info.render.manualFrame;
      } catch (e) {
        console.log(this.source);

        debugger;
      }
    }

    return this.frustumTested;
  }

  updateStyle(opts = {}) {
    // if (opts.color && !this.arrayIsEqual(this.color, opts.color)) {
    //     this.color = opts.color;
    // }
    // if (opts.scale && this.geometry._opt.scale != opts.scale) {
    //     this.geometry._opt.scale = opts.scale;
    //     // this.originalScale 	  = opts.scale
    //     this.options.scale = opts.scale;
    //     this.options.invScale =
    //         1 / (this.options.scale * GLOBAL_TEXT_SCALE);
    // }
    // if (opts.width && this.geometry.layout.width != opts.width) {
    //     this.options.width = opts.width;
    //     this.geometry._opt.width = opts.width;
    // }
    // if (opts.align && this.geometry._opt.align != opts.align) {
    //     this.options.align = opts.align;
    //     this.geometry._opt.align = opts.align;
    // }
    // if (
    //     opts.lineHeight &&
    //     this.geometry._opt.lineHeight != opts.lineHeight
    // ) {
    //     this.options.lineHeight = opts.lineHeight;
    //     this.geometry._opt.lineHeight = opts.lineHeight;
    // }
    // this.update(this.text);
  }

  set position(val) {
    this._position.copy(val);

    let i = 0;

    while (i < this.wrappers.length) {
      this.wrappers[i].position = val;

      i++;
    }
  }

  get position() {
    return this._position;
  }

  attachTo(source) {
    this.source = source;

    let i = 0;

    while (i < this.wrappers.length) {
      this.wrappers[i].attachTo(source);

      i++;
    }
  }

  set opacity(val) {
    this._opacity = val;

    let i = 0;

    while (i < this.wrappers.length) {
      this.wrappers[i].opacity = val;

      i++;
    }
  }

  get opacity() {
    return this._opacity;
  }

  set alpha(val) {
    this.opacity = val;
  }

  get alpha() {
    return this.opacity;
  }

  set scale(val) {
    this._scale = val;

    let i = 0;

    while (i < this.wrappers.length) {
      this.wrappers[i].scale = val;

      i++;
    }
  }

  get scale() {
    return this._scale;
  }

  set color(val) {
    let i = 0;

    while (i < this.wrappers.length) {
      this.wrappers[i].color.r = val[0];
      this.wrappers[i].color.g = val[1];
      this.wrappers[i].color.b = val[2];

      i++;
    }
  }

  set visible(val) {
    this._visible = val;

    let i = 0;

    while (i < this.wrappers.length) {
      this.wrappers[i].visible = val;

      i++;
    }
  }

  get visible() {
    return this._visible;
  }

  dispose() {
    let i = 0;

    while (i < this.wrappers.length) {
      this.mesh.remove(this.wrappers[i]);

      i++;
    }

    this.wrappers = [];
  }

  get size() {
    return this._size;
  }

  set size(val) {
    this._size = val;
  }
}
