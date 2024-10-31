import { ShaderMaterial, RGBADepthPacking } from "three";

import { FPS_BAKING } from "engine/constants";

import GetMeta from "./shader/meta.js";

import GetAdditionalMetas from "./shader/additionalsmeta.js";

import Shared from "engine/globals/shared";

import ShadowVert from "./shader/shadow.vert";
import ShadowFrag from "./shader/shadow.frag";

export default class ShadowMaterial extends ShaderMaterial {
  constructor(options) {
    // debugger;

    var metaVertex = GetMeta(options.metadata);

    var additionalMetas = GetAdditionalMetas(options.additionalMetas);

    const width = options.animationTexture.source
      ? options.animationTexture.source.data.width
      : options.animationTexture.width;

    const height = options.animationTexture.source
      ? options.animationTexture.source.data.height
      : options.animationTexture.height;

    var MetaVertex = ShadowVert;

    MetaVertex = MetaVertex.replace(
      "void main() {",
      "void main() {\n" + metaVertex
    );

    MetaVertex = MetaVertex.replace(
      "void main() {",
      "void main() {\n" + additionalMetas
    );

    options.base.updateWorldMatrix(true, true);

    options.base.bind(options.base.skeleton);

    let opts = {
      vertexShader: MetaVertex,

      fragmentShader: ShadowFrag,

      uniforms: {
        baseScale: {
          value: options.scale,
        },

        bindMatrix: {
          value: options.base.bindMatrix,
        },

        bindMatrixInverse: {
          value: options.base.bindMatrixInverse,
        },

        boneTexture: {
          value: options.animationTexture.texture
            ? options.animationTexture.texture
            : options.animationTexture,
        },

        timer: Shared.animationTimer,
      },

      defines: {
        DEPTH_PACKING: RGBADepthPacking,

        FPS: 1 / FPS_BAKING,

        TEXTURE_HEIGHT: height + ".0",

        PX_WIDTH: 1.0 / width,

        PX_HEIGHT: 1.0 / height,

        META_DATA_UV_OFFSET_X: options.metadata.uvPos.x,

        META_DATA_UV_OFFSET_Y: options.metadata.uvPos.y,

        META_DATA_UV_SCALE_X: options.metadata.uvScale.x,

        META_DATA_UV_SCALE_Y: options.metadata.uvScale.y,

        META_DATA_LENGTH: options.metadata.image.source.data.data.length / 4,

        ADDITIONAL_META_DATA_UV_OFFSET_X: options.additionalMetas.uvPos.x,

        ADDITIONAL_META_DATA_UV_OFFSET_Y: options.additionalMetas.uvPos.y,

        ADDITIONAL_META_DATA_UV_SCALE_X: options.additionalMetas.uvScale.x,

        ADDITIONAL_META_DATA_UV_SCALE_Y: options.additionalMetas.uvScale.y,

        ADDITIONAL_META_DATA_LENGTH:
          options.additionalMetas.image.source.data.data.length / 4,
      },

      shadowSide: 2,

      transparent: false,

      side: options.base.material.side,
    };

    // opts.defines["RDM"+Math.random()] = ''

    for (var val in opts.defines) {
      if (opts.defines[val] === 0.0) {
        opts.defines[val] += "0.0";
      }

      if (opts.defines[val] === 1.0) {
        opts.defines[val] += "0.0";
      }
    }

    super(opts);

    this.opts = opts;
  }

  clone() {
    return new ShaderMaterial(this.opts);
  }
}
