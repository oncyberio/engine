import * as THREE from "three";

var regExp = /([\s\S]*?\bvoid\b +\bmain\b[\s\S]*?{)([\s\S]*)}/m;

let insert = (str) => {
  if (str != "") {
    return "\n" + str + "\n\n";
  } else {
    return "";
  }
};

let generateSubstringFromHooks = (hooks) => {
  return `${insert(hooks.prefix)}$1${insert(hooks.main)}$2${insert(
    hooks.suffix
  )}}`;
};

function hashCode(str) {
  return str
    .split("")
    .reduce(
      (prevHash, currVal) =>
        ((prevHash << 5) - prevHash + currVal.charCodeAt(0)) | 0,
      0
    );
}

let cache = {};

// globalThis.c = cache

let setProgramCacheKey = (material, name) => {
  var key = "";

  if (material._data.uniforms != null) {
    for (const prop in material._data.uniforms) {
      key += prop + ",";
    }
  }

  if (material._data.vertexShaderHooks != null) {
    if (material._data.vertexShaderHooks.prefix != null) {
      key += material._data.vertexShaderHooks.prefix;
    }
    if (material._data.vertexShaderHooks.main != null) {
      key += material._data.vertexShaderHooks.main;
    }
    if (material._data.vertexShaderHooks.suffix != null) {
      key += material._data.vertexShaderHooks.suffix;
    }
  }
  if (material._data.fragmentShaderHooks != null) {
    if (material._data.fragmentShaderHooks.prefix != null) {
      key += material._data.fragmentShaderHooks.prefix;
    }
    if (material._data.fragmentShaderHooks.main != null) {
      key += material._data.fragmentShaderHooks.main;
    }
    if (material._data.fragmentShaderHooks.suffix != null) {
      key += material._data.fragmentShaderHooks.suffix;
    }
  }

  if (material._data.defines != null) {
    for (const prop in material._data.defines) {
      key += prop + "," + material._data.defines[prop] + ",";
    }
  }

  if (material._data.chunks != null) {
    for (const prop in material._data.chunks) {
      key += prop + ",";
    }
  }

  if (material.transparent == true) {
    key += "transparent,";
  }

  if (material._data.plugins != null && material._data.plugins.length > 0) {
    let i = 0;

    while (i < material._data.plugins.length) {
      key += material._data.plugins[i].name + ".";

      if (material._data.plugins[i].defines != null) {
        for (const prop in material._data.plugins[i].defines) {
          key += prop + "," + material._data.plugins[i].defines[prop] + ",";
        }
      }

      if (material._data.plugins[i].vertexShaderHooks != null) {
        if (material._data.plugins[i].vertexShaderHooks.prefix != null) {
          key += material._data.plugins[i].vertexShaderHooks.prefix;
        }
        if (material._data.plugins[i].vertexShaderHooks.main != null) {
          key += material._data.plugins[i].vertexShaderHooks.main;
        }
        if (material._data.plugins[i].vertexShaderHooks.suffix != null) {
          key += material._data.plugins[i].vertexShaderHooks.suffix;
        }
      }

      if (material._data.plugins[i].fragmentShaderHooks != null) {
        if (material._data.plugins[i].fragmentShaderHooks.prefix != null) {
          key += material._data.plugins[i].fragmentShaderHooks.prefix;
        }
        if (material._data.plugins[i].fragmentShaderHooks.main != null) {
          key += material._data.plugins[i].fragmentShaderHooks.main;
        }
        if (material._data.plugins[i].fragmentShaderHooks.suffix != null) {
          key += material._data.plugins[i].fragmentShaderHooks.suffix;
        }
      }

      i++;
    }
  }

  if (key != "") {
    key += name + ",";

    var result = key.replace(/[\n\r]/g, "").replace(/\s/g, "");

    result = hashCode(result);

    material.customProgramCacheKey = function () {
      return result;
    };
  }
};

let setOnBeforeCompile = (material, name = null) => {
  material.onBeforeCompile = (shader) => {
    let vertexShaderHooks = Object.assign(
      { prefix: "", main: "", suffix: "" },
      material._data.vertexShaderHooks
    );

    let fragmentShaderHooks = Object.assign(
      { prefix: "", main: "", suffix: "" },
      material._data.fragmentShaderHooks
    );

    try {
      material._data.uniforms = Object.assign(
        shader.uniforms,
        material._data.uniforms
      );
    } catch (e) {
      debugger;
    }

    let originalShader = name != null ? THREE.ShaderLib[name] : shader;

    shader.vertexShader = originalShader.vertexShader.replace(
      regExp,
      generateSubstringFromHooks(vertexShaderHooks)
    );

    // no fragment for depth material

    shader.fragmentShader = originalShader.fragmentShader.replace(
      "void main() {",
      fragmentShaderHooks.prefix + "\nvoid main() {"
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      "void main() {",
      "void main() {\n" + fragmentShaderHooks.main
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <fog_fragment>",
      fragmentShaderHooks.suffix + "\n#include <fog_fragment>"
    );

    if (material._data.chunks != null) {
      if (material._data.chunks.vertex != null) {
        for (const prop in material._data.chunks.vertex) {
          shader.vertexShader = shader.vertexShader.replace(
            `#include <${prop}>`,
            material._data.chunks.vertex[prop]
          );
        }
      }

      if (material._data.chunks.fragment != null) {
        for (const prop in material._data.chunks.fragment) {
          shader.fragmentShader = shader.fragmentShader.replace(
            `#include <${prop}>`,
            material._data.chunks.fragment[prop]
          );
        }
      }
    }

    if (material._data.replacers != null) {
      if (material._data.replacers.vertex != null) {
        let i = 0;

        while (i < material._data.replacers.vertex.length) {
          let data = material._data.replacers.vertex[i];

          shader.vertexShader = shader.vertexShader.replace(
            data.source,
            data.replace
          );

          i++;
        }
      }

      if (material._data.replacers.fragment != null) {
        let i = 0;

        while (i < material._data.replacers.fragment.length) {
          let data = material._data.replacers.fragment[i];

          shader.fragmentShader = shader.fragmentShader.replace(
            data.source,
            data.replace
          );

          i++;
        }
      }
    }

    if (shader.defines == null) {
      shader.defines = {};
    }

    if (material._data.defines) {
      for (const prop in material._data.defines) {
        shader.defines[prop] = material._data.defines[prop];
      }
    }

    // main, and prefix hook are added in inverse
    // suffix hooks are added in order

    if (material._data.plugins && material._data.plugins.length > 0) {
      let i = material._data.plugins.length - 1;

      while (i > -1) {
        const plugin = material._data.plugins[i];

        let vertexShaderHooks = Object.assign(
          { prefix: "", main: "", suffix: "" },
          plugin.vertexShaderHooks
        );

        let fragmentShaderHooks = Object.assign(
          { prefix: "", main: "", suffix: "" },
          plugin.fragmentShaderHooks
        );

        vertexShaderHooks.suffix = "";
        fragmentShaderHooks.suffix = "";

        shader.vertexShader = shader.vertexShader.replace(
          regExp,
          generateSubstringFromHooks(vertexShaderHooks)
        );

        shader.fragmentShader = shader.fragmentShader.replace(
          regExp,
          generateSubstringFromHooks(fragmentShaderHooks)
        );

        material._data.uniforms = Object.assign(
          {},
          plugin.uniforms,
          material._data.uniforms
        );

        if (plugin.chunks != null) {
          if (plugin.chunks.vertex != null) {
            for (const prop in plugin.chunks.vertex) {
              shader.vertexShader = shader.vertexShader.replace(
                `#include <${prop}>`,
                plugin.chunks.vertex[prop]
              );
            }
          }

          if (plugin.chunks.fragment != null) {
            for (const prop in plugin.chunks.fragment) {
              shader.fragmentShader = shader.fragmentShader.replace(
                `#include <${prop}>`,
                plugin.chunks.fragment[prop]
              );
            }
          }
        }

        if (plugin.replacers != null) {
          if (plugin.replacers.vertex != null) {
            let i = 0;

            while (i < plugin.replacers.vertex.length) {
              let data = plugin.replacers.vertex[i];

              shader.vertexShader = shader.vertexShader.replace(
                data.source,
                data.replace
              );

              i++;
            }
          }

          if (plugin.replacers.fragment != null) {
            let i = 0;

            while (i < plugin.replacers.fragment.length) {
              let data = plugin.replacers.fragment[i];

              shader.fragmentShader = shader.fragmentShader.replace(
                data.source,
                data.replace
              );

              i++;
            }
          }
        }

        for (const prop in plugin.defines) {
          shader.defines[prop] = plugin.defines[prop];
        }

        if (plugin.transparent != null && name != "shadow") {
          material.transparent = plugin.transparent || material.transparent;
        }

        i--;
      }

      i = 0;

      // second loop forget defines, forget replacers, uniforms etc..
      // that was already set in the first loop
      while (i < material._data.plugins.length) {
        const plugin = material._data.plugins[i];

        let vertexShaderHooks = Object.assign(
          { prefix: "", main: "", suffix: "" },
          plugin.vertexShaderHooks
        );

        let fragmentShaderHooks = Object.assign(
          { prefix: "", main: "", suffix: "" },
          plugin.fragmentShaderHooks
        );

        vertexShaderHooks.prefix = "";
        fragmentShaderHooks.prefix = "";

        vertexShaderHooks.main = "";
        fragmentShaderHooks.main = "";

        shader.vertexShader = shader.vertexShader.replace(
          regExp,
          generateSubstringFromHooks(vertexShaderHooks)
        );

        shader.fragmentShader = shader.fragmentShader.replace(
          regExp,
          generateSubstringFromHooks(fragmentShaderHooks)
        );

        i++;
      }
    }

    shader.uniforms = material._data.uniforms;

    material.uniforms = material._data.uniforms;

    material.shader = shader;
  };
};

// override
// import FogFragment from "./override/fog.glsl";
// import FogFragment from "./override/midfog.glsl";
import EncodingFragment from "./override/encoding.glsl";

import ShadowParsFragment from "./override/shadowparsfrag.glsl";

import LightFragment from "./override/lightfragment.glsl";

// // lights_fragment_begin.glsl.js

export var ShaderOverride = function () {
  // THREE.ShaderChunk.fog_fragment              = FogFragment

  THREE.ShaderChunk.colorSpaces_fragment = EncodingFragment;

  THREE.ShaderChunk.shadowmap_pars_fragment = ShadowParsFragment;

  THREE.ShaderChunk.lights_fragment_begin = LightFragment;
  // lights_fragment_begin.glsl.js
};

export class ShadowMaterial extends THREE.ShadowMaterial {
  constructor(opts = {}) {
    super(opts);

    this._data = opts;

    setProgramCacheKey(this, "shadow");

    setOnBeforeCompile(this, "shadow");
  }
}

export class MeshBasicMaterial extends THREE.MeshBasicMaterial {
  constructor(opts = {}) {
    super(opts);

    this._data = opts;

    setProgramCacheKey(this, "basic");

    setOnBeforeCompile(this, "basic");
  }
}

export class LineBasicMaterial extends THREE.LineBasicMaterial {
  constructor(opts = {}) {
    super(opts);

    this._data = opts;

    setProgramCacheKey(this, "basic");

    setOnBeforeCompile(this, "basic");
  }
}

export class MeshToonMaterial extends THREE.MeshToonMaterial {
  constructor(opts = {}) {
    super(opts);

    this._data = opts;

    setProgramCacheKey(this, "toon");

    setOnBeforeCompile(this, "toon");
  }
  copy(source) {
    if (source.name !== undefined) {
      this.name = source.name;
    }

    if (source.blending !== undefined) {
      this.blending = source.blending;
    }

    if (source.side !== undefined) {
      this.side = source.side;
    }

    if (source.vertexColors !== undefined) {
      this.vertexColors = source.vertexColors;
    }

    if (source.opacity !== undefined) {
      this.opacity = source.opacity;
    }

    if (source.transparent !== undefined) {
      this.transparent = source.transparent;
    }

    if (source.blendSrc !== undefined) {
      this.blendSrc = source.blendSrc;
    }

    if (source.blendDst !== undefined) {
      this.blendDst = source.blendDst;
    }

    if (source.blendEquation !== undefined) {
      this.blendEquation = source.blendEquation;
    }

    if (source.blendSrcAlpha !== undefined) {
      this.blendSrcAlpha = source.blendSrcAlpha;
    }

    if (source.blendDstAlpha !== undefined) {
      this.blendDstAlpha = source.blendDstAlpha;
    }

    if (source.blendEquationAlpha !== undefined) {
      this.blendEquationAlpha = source.blendEquationAlpha;
    }

    if (source.blendColor !== undefined) {
      this.blendColor.copy(source.blendColor);
    }

    if (source.blendAlpha !== undefined) {
      this.blendAlpha = source.blendAlpha;
    }

    if (source.depthFunc !== undefined) {
      this.depthFunc = source.depthFunc;
    }

    if (source.depthTest !== undefined) {
      this.depthTest = source.depthTest;
    }

    if (source.depthWrite !== undefined) {
      this.depthWrite = source.depthWrite;
    }

    if (source.stencilWriteMask !== undefined) {
      this.stencilWriteMask = source.stencilWriteMask;
    }

    if (source.stencilFunc !== undefined) {
      this.stencilFunc = source.stencilFunc;
    }

    if (source.stencilRef !== undefined) {
      this.stencilRef = source.stencilRef;
    }

    if (source.stencilFuncMask !== undefined) {
      this.stencilFuncMask = source.stencilFuncMask;
    }

    if (source.stencilFail !== undefined) {
      this.stencilFail = source.stencilFail;
    }

    if (source.stencilZFail !== undefined) {
      this.stencilZFail = source.stencilZFail;
    }

    if (source.stencilZPass !== undefined) {
      this.stencilZPass = source.stencilZPass;
    }

    if (source.stencilWrite !== undefined) {
      this.stencilWrite = source.stencilWrite;
    }

    if (source.clippingPlanes !== undefined) {
      const srcPlanes = source.clippingPlanes;
      let dstPlanes = null;

      if (srcPlanes !== null) {
        const n = srcPlanes.length;
        dstPlanes = new Array(n);

        for (let i = 0; i !== n; ++i) {
          dstPlanes[i] = srcPlanes[i].clone();
        }
      }

      this.clippingPlanes = dstPlanes;
    }

    if (source.clipIntersection !== undefined) {
      this.clipIntersection = source.clipIntersection;
    }

    if (source.clipShadows !== undefined) {
      this.clipShadows = source.clipShadows;
    }

    if (source.shadowSide !== undefined) {
      this.shadowSide = source.shadowSide;
    }

    if (source.colorWrite !== undefined) {
      this.colorWrite = source.colorWrite;
    }

    if (source.precision !== undefined) {
      this.precision = source.precision;
    }

    if (source.polygonOffset !== undefined) {
      this.polygonOffset = source.polygonOffset;
    }

    if (source.polygonOffsetFactor !== undefined) {
      this.polygonOffsetFactor = source.polygonOffsetFactor;
    }

    if (source.polygonOffsetUnits !== undefined) {
      this.polygonOffsetUnits = source.polygonOffsetUnits;
    }

    if (source.dithering !== undefined) {
      this.dithering = source.dithering;
    }

    if (source.alphaTest !== undefined) {
      this.alphaTest = source.alphaTest;
    }

    if (source.alphaHash !== undefined) {
      this.alphaHash = source.alphaHash;
    }

    if (source.alphaToCoverage !== undefined) {
      this.alphaToCoverage = source.alphaToCoverage;
    }

    if (source.premultipliedAlpha !== undefined) {
      this.premultipliedAlpha = source.premultipliedAlpha;
    }

    if (source.forceSinglePass !== undefined) {
      this.forceSinglePass = source.forceSinglePass;
    }

    if (source.visible !== undefined) {
      this.visible = source.visible;
    }

    if (source.toneMapped !== undefined) {
      this.toneMapped = source.toneMapped;
    }

    if (source.userData !== undefined) {
      this.userData = JSON.parse(JSON.stringify(source.userData));
    }

    if (source.color !== undefined) {
      this.color.copy(source.color);
    }

    if (source.map !== undefined) {
      this.map = source.map;
    }

    if (source.lightMap !== undefined) {
      this.lightMap = source.lightMap;
    }

    if (source.lightMapIntensity !== undefined) {
      this.lightMapIntensity = source.lightMapIntensity;
    }

    if (source.aoMap !== undefined) {
      this.aoMap = source.aoMap;
    }

    if (source.aoMapIntensity !== undefined) {
      this.aoMapIntensity = source.aoMapIntensity;
    }

    if (source.emissive !== undefined) {
      this.emissive.copy(source.emissive);
    }

    if (source.emissiveMap !== undefined) {
      this.emissiveMap = source.emissiveMap;
    }

    if (source.emissiveIntensity !== undefined) {
      this.emissiveIntensity = source.emissiveIntensity;
    }

    if (source.bumpMap !== undefined) {
      this.bumpMap = source.bumpMap;
    }

    if (source.bumpScale !== undefined) {
      this.bumpScale = source.bumpScale;
    }

    if (source.normalMap !== undefined) {
      this.normalMap = source.normalMap;
    }

    if (source.normalMapType !== undefined) {
      this.normalMapType = source.normalMapType;
    }

    if (source.normalScale !== undefined) {
      this.normalScale.copy(source.normalScale);
    }

    if (source.displacementMap !== undefined) {
      this.displacementMap = source.displacementMap;
    }

    if (source.displacementScale !== undefined) {
      this.displacementScale = source.displacementScale;
    }

    if (source.displacementBias !== undefined) {
      this.displacementBias = source.displacementBias;
    }

    if (source.specularMap !== undefined) {
      this.specularMap = source.specularMap;
    }

    if (source.alphaMap !== undefined) {
      this.alphaMap = source.alphaMap;
    }

    if (source.envMap !== undefined) {
      this.envMap = source.envMap;
    }

    if (source.combine !== undefined) {
      this.combine = source.combine;
    }

    if (source.reflectivity !== undefined) {
      this.reflectivity = source.reflectivity;
    }

    if (source.refractionRatio !== undefined) {
      this.refractionRatio = source.refractionRatio;
    }

    if (source.wireframe !== undefined) {
      this.wireframe = source.wireframe;
    }

    if (source.wireframeLinewidth !== undefined) {
      this.wireframeLinewidth = source.wireframeLinewidth;
    }

    if (source.wireframeLinecap !== undefined) {
      this.wireframeLinecap = source.wireframeLinecap;
    }

    if (source.wireframeLinejoin !== undefined) {
      this.wireframeLinejoin = source.wireframeLinejoin;
    }

    if (source.flatShading !== undefined) {
      this.flatShading = source.flatShading;
    }

    if (source.fog !== undefined) {
      this.fog = source.fog;
    }

    return this;
  }
}

export class MeshLambertMaterial extends THREE.MeshLambertMaterial {
  constructor(opts = {}) {
    super(opts);

    this._data = opts;

    setProgramCacheKey(this, "lambert");

    setOnBeforeCompile(this, "lambert");
  }

  copy(source) {
    if (source.name !== undefined) {
      this.name = source.name;
    }

    if (source.blending !== undefined) {
      this.blending = source.blending;
    }

    if (source.side !== undefined) {
      this.side = source.side;
    }

    if (source.vertexColors !== undefined) {
      this.vertexColors = source.vertexColors;
    }

    if (source.opacity !== undefined) {
      this.opacity = source.opacity;
    }

    if (source.transparent !== undefined) {
      this.transparent = source.transparent;
    }

    if (source.blendSrc !== undefined) {
      this.blendSrc = source.blendSrc;
    }

    if (source.blendDst !== undefined) {
      this.blendDst = source.blendDst;
    }

    if (source.blendEquation !== undefined) {
      this.blendEquation = source.blendEquation;
    }

    if (source.blendSrcAlpha !== undefined) {
      this.blendSrcAlpha = source.blendSrcAlpha;
    }

    if (source.blendDstAlpha !== undefined) {
      this.blendDstAlpha = source.blendDstAlpha;
    }

    if (source.blendEquationAlpha !== undefined) {
      this.blendEquationAlpha = source.blendEquationAlpha;
    }

    if (source.blendColor !== undefined) {
      this.blendColor.copy(source.blendColor);
    }

    if (source.blendAlpha !== undefined) {
      this.blendAlpha = source.blendAlpha;
    }

    if (source.depthFunc !== undefined) {
      this.depthFunc = source.depthFunc;
    }

    if (source.depthTest !== undefined) {
      this.depthTest = source.depthTest;
    }

    if (source.depthWrite !== undefined) {
      this.depthWrite = source.depthWrite;
    }

    if (source.stencilWriteMask !== undefined) {
      this.stencilWriteMask = source.stencilWriteMask;
    }

    if (source.stencilFunc !== undefined) {
      this.stencilFunc = source.stencilFunc;
    }

    if (source.stencilRef !== undefined) {
      this.stencilRef = source.stencilRef;
    }

    if (source.stencilFuncMask !== undefined) {
      this.stencilFuncMask = source.stencilFuncMask;
    }

    if (source.stencilFail !== undefined) {
      this.stencilFail = source.stencilFail;
    }

    if (source.stencilZFail !== undefined) {
      this.stencilZFail = source.stencilZFail;
    }

    if (source.stencilZPass !== undefined) {
      this.stencilZPass = source.stencilZPass;
    }

    if (source.stencilWrite !== undefined) {
      this.stencilWrite = source.stencilWrite;
    }

    if (source.clippingPlanes !== undefined) {
      const srcPlanes = source.clippingPlanes;
      let dstPlanes = null;

      if (srcPlanes !== null) {
        const n = srcPlanes.length;
        dstPlanes = new Array(n);

        for (let i = 0; i !== n; ++i) {
          dstPlanes[i] = srcPlanes[i].clone();
        }
      }

      this.clippingPlanes = dstPlanes;
    }

    if (source.clipIntersection !== undefined) {
      this.clipIntersection = source.clipIntersection;
    }

    if (source.clipShadows !== undefined) {
      this.clipShadows = source.clipShadows;
    }

    if (source.shadowSide !== undefined) {
      this.shadowSide = source.shadowSide;
    }

    if (source.colorWrite !== undefined) {
      this.colorWrite = source.colorWrite;
    }

    if (source.precision !== undefined) {
      this.precision = source.precision;
    }

    if (source.polygonOffset !== undefined) {
      this.polygonOffset = source.polygonOffset;
    }

    if (source.polygonOffsetFactor !== undefined) {
      this.polygonOffsetFactor = source.polygonOffsetFactor;
    }

    if (source.polygonOffsetUnits !== undefined) {
      this.polygonOffsetUnits = source.polygonOffsetUnits;
    }

    if (source.dithering !== undefined) {
      this.dithering = source.dithering;
    }

    if (source.alphaTest !== undefined) {
      this.alphaTest = source.alphaTest;
    }

    if (source.alphaHash !== undefined) {
      this.alphaHash = source.alphaHash;
    }

    if (source.alphaToCoverage !== undefined) {
      this.alphaToCoverage = source.alphaToCoverage;
    }

    if (source.premultipliedAlpha !== undefined) {
      this.premultipliedAlpha = source.premultipliedAlpha;
    }

    if (source.forceSinglePass !== undefined) {
      this.forceSinglePass = source.forceSinglePass;
    }

    if (source.visible !== undefined) {
      this.visible = source.visible;
    }

    if (source.toneMapped !== undefined) {
      this.toneMapped = source.toneMapped;
    }

    if (source.userData !== undefined) {
      this.userData = JSON.parse(JSON.stringify(source.userData));
    }

    if (source.color !== undefined) {
      this.color.copy(source.color);
    }

    if (source.map !== undefined) {
      this.map = source.map;
    }

    if (source.lightMap !== undefined) {
      this.lightMap = source.lightMap;
    }

    if (source.lightMapIntensity !== undefined) {
      this.lightMapIntensity = source.lightMapIntensity;
    }

    if (source.aoMap !== undefined) {
      this.aoMap = source.aoMap;
    }

    if (source.aoMapIntensity !== undefined) {
      this.aoMapIntensity = source.aoMapIntensity;
    }

    if (source.emissive !== undefined) {
      this.emissive.copy(source.emissive);
    }

    if (source.emissiveMap !== undefined) {
      this.emissiveMap = source.emissiveMap;
    }

    if (source.emissiveIntensity !== undefined) {
      this.emissiveIntensity = source.emissiveIntensity;
    }

    if (source.bumpMap !== undefined) {
      this.bumpMap = source.bumpMap;
    }

    if (source.bumpScale !== undefined) {
      this.bumpScale = source.bumpScale;
    }

    if (source.normalMap !== undefined) {
      this.normalMap = source.normalMap;
    }

    if (source.normalMapType !== undefined) {
      this.normalMapType = source.normalMapType;
    }

    if (source.normalScale !== undefined) {
      this.normalScale.copy(source.normalScale);
    }

    if (source.displacementMap !== undefined) {
      this.displacementMap = source.displacementMap;
    }

    if (source.displacementScale !== undefined) {
      this.displacementScale = source.displacementScale;
    }

    if (source.displacementBias !== undefined) {
      this.displacementBias = source.displacementBias;
    }

    if (source.specularMap !== undefined) {
      this.specularMap = source.specularMap;
    }

    if (source.alphaMap !== undefined) {
      this.alphaMap = source.alphaMap;
    }

    if (source.envMap !== undefined) {
      this.envMap = source.envMap;
    }

    if (source.combine !== undefined) {
      this.combine = source.combine;
    }

    if (source.reflectivity !== undefined) {
      this.reflectivity = source.reflectivity;
    }

    if (source.refractionRatio !== undefined) {
      this.refractionRatio = source.refractionRatio;
    }

    if (source.wireframe !== undefined) {
      this.wireframe = source.wireframe;
    }

    if (source.wireframeLinewidth !== undefined) {
      this.wireframeLinewidth = source.wireframeLinewidth;
    }

    if (source.wireframeLinecap !== undefined) {
      this.wireframeLinecap = source.wireframeLinecap;
    }

    if (source.wireframeLinejoin !== undefined) {
      this.wireframeLinejoin = source.wireframeLinejoin;
    }

    if (source.flatShading !== undefined) {
      this.flatShading = source.flatShading;
    }

    if (source.fog !== undefined) {
      this.fog = source.fog;
    }

    return this;
  }
}

export class MeshStandardMaterial extends THREE.MeshStandardMaterial {
  constructor(opts = {}) {
    super(opts);

    this._data = opts;

    setProgramCacheKey(this, "standard");

    setOnBeforeCompile(this, "standard");
  }

  copy(source) {
    if (source.name !== undefined) {
      this.name = source.name;
    }

    if (source.blending !== undefined) {
      this.blending = source.blending;
    }

    if (source.side !== undefined) {
      this.side = source.side;
    }

    if (source.vertexColors !== undefined) {
      this.vertexColors = source.vertexColors;
    }

    if (source.opacity !== undefined) {
      this.opacity = source.opacity;
    }

    if (source.transparent !== undefined) {
      this.transparent = source.transparent;
    }

    if (source.blendSrc !== undefined) {
      this.blendSrc = source.blendSrc;
    }

    if (source.blendDst !== undefined) {
      this.blendDst = source.blendDst;
    }

    if (source.blendEquation !== undefined) {
      this.blendEquation = source.blendEquation;
    }

    if (source.blendSrcAlpha !== undefined) {
      this.blendSrcAlpha = source.blendSrcAlpha;
    }

    if (source.blendDstAlpha !== undefined) {
      this.blendDstAlpha = source.blendDstAlpha;
    }

    if (source.blendEquationAlpha !== undefined) {
      this.blendEquationAlpha = source.blendEquationAlpha;
    }

    if (source.blendColor !== undefined) {
      this.blendColor.copy(source.blendColor);
    }

    if (source.blendAlpha !== undefined) {
      this.blendAlpha = source.blendAlpha;
    }

    if (source.depthFunc !== undefined) {
      this.depthFunc = source.depthFunc;
    }

    if (source.depthTest !== undefined) {
      this.depthTest = source.depthTest;
    }

    if (source.depthWrite !== undefined) {
      this.depthWrite = source.depthWrite;
    }

    if (source.stencilWriteMask !== undefined) {
      this.stencilWriteMask = source.stencilWriteMask;
    }

    if (source.stencilFunc !== undefined) {
      this.stencilFunc = source.stencilFunc;
    }

    if (source.stencilRef !== undefined) {
      this.stencilRef = source.stencilRef;
    }

    if (source.stencilFuncMask !== undefined) {
      this.stencilFuncMask = source.stencilFuncMask;
    }

    if (source.stencilFail !== undefined) {
      this.stencilFail = source.stencilFail;
    }

    if (source.stencilZFail !== undefined) {
      this.stencilZFail = source.stencilZFail;
    }

    if (source.stencilZPass !== undefined) {
      this.stencilZPass = source.stencilZPass;
    }

    if (source.stencilWrite !== undefined) {
      this.stencilWrite = source.stencilWrite;
    }

    if (source.clippingPlanes !== undefined) {
      const srcPlanes = source.clippingPlanes;
      let dstPlanes = null;

      if (srcPlanes !== null) {
        const n = srcPlanes.length;
        dstPlanes = new Array(n);

        for (let i = 0; i !== n; ++i) {
          dstPlanes[i] = srcPlanes[i].clone();
        }
      }

      this.clippingPlanes = dstPlanes;
    }

    if (source.clipIntersection !== undefined) {
      this.clipIntersection = source.clipIntersection;
    }

    if (source.clipShadows !== undefined) {
      this.clipShadows = source.clipShadows;
    }

    if (source.shadowSide !== undefined) {
      this.shadowSide = source.shadowSide;
    }

    if (source.colorWrite !== undefined) {
      this.colorWrite = source.colorWrite;
    }

    if (source.precision !== undefined) {
      this.precision = source.precision;
    }

    if (source.polygonOffset !== undefined) {
      this.polygonOffset = source.polygonOffset;
    }

    if (source.polygonOffsetFactor !== undefined) {
      this.polygonOffsetFactor = source.polygonOffsetFactor;
    }

    if (source.polygonOffsetUnits !== undefined) {
      this.polygonOffsetUnits = source.polygonOffsetUnits;
    }

    if (source.dithering !== undefined) {
      this.dithering = source.dithering;
    }

    if (source.alphaTest !== undefined) {
      this.alphaTest = source.alphaTest;
    }

    if (source.alphaHash !== undefined) {
      this.alphaHash = source.alphaHash;
    }

    if (source.alphaToCoverage !== undefined) {
      this.alphaToCoverage = source.alphaToCoverage;
    }

    if (source.premultipliedAlpha !== undefined) {
      this.premultipliedAlpha = source.premultipliedAlpha;
    }

    if (source.forceSinglePass !== undefined) {
      this.forceSinglePass = source.forceSinglePass;
    }

    if (source.visible !== undefined) {
      this.visible = source.visible;
    }

    if (source.toneMapped !== undefined) {
      this.toneMapped = source.toneMapped;
    }

    if (source.userData !== undefined) {
      this.userData = JSON.parse(JSON.stringify(source.userData));
    }

    this.defines = { STANDARD: "" };

    if (source.color !== undefined) {
      this.color.copy(source.color);
    }

    this.roughness = source.roughness !== undefined ? source.roughness : 1;
    this.metalness = source.metalness !== undefined ? source.metalness : 0;

    if (source.map !== undefined) {
      this.map = source.map;
    }

    if (source.lightMap !== undefined) {
      this.lightMap = source.lightMap;
    }

    if (source.lightMapIntensity !== undefined) {
      this.lightMapIntensity = source.lightMapIntensity;
    }

    if (source.aoMap !== undefined) {
      this.aoMap = source.aoMap;
    }

    if (source.aoMapIntensity !== undefined) {
      this.aoMapIntensity = source.aoMapIntensity;
    }

    if (source.emissive !== undefined) {
      this.emissive.copy(source.emissive);
    }

    if (source.emissiveMap !== undefined) {
      this.emissiveMap = source.emissiveMap;
    }

    if (source.emissiveIntensity !== undefined) {
      this.emissiveIntensity = source.emissiveIntensity;
    }

    if (source.bumpMap !== undefined) {
      this.bumpMap = source.bumpMap;
    }

    if (source.bumpScale !== undefined) {
      this.bumpScale = source.bumpScale;
    }

    if (source.normalMap !== undefined) {
      this.normalMap = source.normalMap;
    }

    if (source.normalMapType !== undefined) {
      this.normalMapType = source.normalMapType;
    }

    if (source.normalScale !== undefined) {
      this.normalScale.copy(source.normalScale);
    }

    if (source.displacementMap !== undefined) {
      this.displacementMap = source.displacementMap;
    }

    if (source.displacementScale !== undefined) {
      this.displacementScale = source.displacementScale;
    }

    if (source.displacementBias !== undefined) {
      this.displacementBias = source.displacementBias;
    }

    if (source.roughnessMap !== undefined) {
      this.roughnessMap = source.roughnessMap;
    }

    if (source.metalnessMap !== undefined) {
      this.metalnessMap = source.metalnessMap;
    }

    if (source.alphaMap !== undefined) {
      this.alphaMap = source.alphaMap;
    }

    if (source.envMap !== undefined) {
      this.envMap = source.envMap;
    }

    if (source.envMapIntensity !== undefined) {
      this.envMapIntensity = source.envMapIntensity;
    }

    if (source.wireframe !== undefined) {
      this.wireframe = source.wireframe;
    }

    if (source.wireframeLinewidth !== undefined) {
      this.wireframeLinewidth = source.wireframeLinewidth;
    }

    if (source.wireframeLinecap !== undefined) {
      this.wireframeLinecap = source.wireframeLinecap;
    }

    if (source.wireframeLinejoin !== undefined) {
      this.wireframeLinejoin = source.wireframeLinejoin;
    }

    if (source.flatShading !== undefined) {
      this.flatShading = source.flatShading;
    }

    if (source.fog !== undefined) {
      this.fog = source.fog;
    }

    return this;
  }
}

export class MeshShadowMaterial extends THREE.MeshDepthMaterial {
  constructor(opts = {}) {
    opts.depthPacking = THREE.RGBADepthPacking;

    super(opts);

    this._data = opts;

    this.debug = false;

    setProgramCacheKey(this, "depth");

    setOnBeforeCompile(this, "depth");
  }
}

export class ShaderMaterial extends THREE.ShaderMaterial {
  constructor(opts = {}) {
    super(opts);

    this._data = opts;

    this.debug = false;

    setOnBeforeCompile(this);
  }
}

export class BillboardYMaterial extends THREE.MeshBasicMaterial {
  constructor(_customCreateOption) {
    super(Object.assign({}, _customCreateOption));

    this.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        `#include <project_vertex>`,
        `

                    vec4 p = vec4( transformed, 1.0 );
                    vec3 scale = vec3(0.0);

                    scale.x = length(modelMatrix[0]);
                    scale.y = length(modelMatrix[1]);
                    scale.z = length(modelMatrix[2]);

                    #ifdef USE_INSTANCING
                        p = instanceMatrix * vec4(0, 0, 0, 1.0);

                        scale.x = length(instanceMatrix[0]);
                        scale.y = length(instanceMatrix[1]);
                        scale.z = length(instanceMatrix[2]);

                    #endif
                    p.xyz =  billboardX( position.xyz , viewMatrix, p.xyz , scale );

                    vec4 mvPosition = modelViewMatrix * p;
                    gl_Position = projectionMatrix * mvPosition;

                    `
      );

      shader.vertexShader = shader.vertexShader.replace(
        `void main() {`,
        `
                    vec3 billboardX(vec3 v, mat4 view, vec3 center, vec3 size) {
                        vec3 look = cameraPosition + (vec3(view[0][2], view[1][2], view[2][2])) * 3000.0;
                        look.y = 0.0;
                        look = normalize(look);

                        vec3 billboardUp = vec3(0., 1., 0.);
                        vec3 billboardRight = cross(billboardUp, look);
                        vec3 pos = center + billboardRight * v.x * size.x + billboardUp * v.y * size.y;
                        return pos;
                    }
                    void main() {
                `
      );
    };
  }
}
