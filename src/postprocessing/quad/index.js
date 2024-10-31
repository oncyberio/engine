import {
  Scene,
  OrthographicCamera,
  ShaderMaterial,
  Color,
  Mesh,
  WebGLRenderTarget,
  LinearFilter,
  HalfFloatType,
  Vector2,
  Texture,
  NearestFilter,
  SRGBColorSpace,
} from "three";

import Textures from "engine/textures";

import SMAAPass from "./smaa";

import Renderer from "engine/renderer";

import Triangle from "engine/globals/geometries/triangle";

import BlendVert from "./blend/main.vert";

import BlendFrag from "./blend/main.frag";

import BlendCityFrag from "./blend/city.frag";

import BlendSSAOFrag from "./blend/ssao.frag";

import LutVert from "./lut/vert.glsl";
import LutFrag from "./lut/frag.glsl";

import TVVert from "./tv/main.vert";

import TVFrag from "./tv/main.frag";

import TrippyVert from "./trippy/main.vert";
import TrippyFrag from "./trippy/main.frag";

import Shared from "engine/globals/shared";

// import LuminanceVert from './luminance/vert.glsl'
// import LuminanceFrag from './luminance/frag.glsl'

// import MipMapBlurPass from './mipmapblur'

import SSAOKernel from "./ssao";

import FXAAFrag from "./blend/fxaa.frag";

import { POST_TYPES } from "../constants";

import { DEBUG } from "engine/constants";

import { BloomEffect } from "postprocessing";

export default class Quad {
  constructor() {
    this.kernels = new Scene();

    this.kernels.matrixWorldAutoUpdate = false;

    this.kernels.matrixAutoUpdate = false;

    this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.settings = {
      minFilter: LinearFilter,

      magFilter: LinearFilter,

      // type: HalfFloatType,

      stencilBuffer: false,

      colorSpace: SRGBColorSpace,

      depthBuffer: false,

      generateMipmaps: false,
    };

    this.width = 1;

    this.height = 1;

    this.initPasses();

    this.FXAA = false;

    // globalThis.quad = this;
  }

  render(source, occlusion, options, t) {
    var target = this.FXAA == true ? this.FXAAtarget : t;

    // this.ssaoKernel.render( source.depthTexture )

    // this.ssaoBlendKernel.material.uniforms.tInput2.value = this.ssaoKernel.output.texture

    // this.compute( this.ssaoBlendKernel, { input: source, output: null, toScreen: true })

    // return;

    const effect = options.type;

    const postProValues = options.value;

    if (effect == POST_TYPES.BLOOM) {
      //debugger;

      this.luminanceMaterial.threshold = postProValues.threshold;
      this.luminanceMaterial.smoothing = postProValues.smoothing;
      this.blendKernel.material.uniforms.intensity.value =
        postProValues.intensity;
      this.bloomEffect.mipmapBlurPass.radius = postProValues.radius;

      // console.log( postProValues.color )

      this.bloomEffect.luminancePass.enabled = true;

      this.bloomEffect.update(Renderer, occlusion);

      this.blendKernel.material.uniforms.tInput2.value =
        this.bloomEffect.getTexture();

      this.blendKernel.material.uniforms.bloomColor.value
        .set(postProValues.color)
        .convertSRGBToLinear();

      this.compute(this.blendKernel, {
        input: source,
        output: target ? target : null,
        toScreen: target ? false : true,
      });
    } else if (effect == "custom") {
      if (this.customKernel == null) {
        this.customKernel = this.initCustomKernel(options);
      }

      if (options.value.useBloom == true) {
        this.bloomEffect.mipmapBlurPass.radius = postProValues.radius;

        this.bloomEffect.luminancePass.enabled =
          postProValues.useLuminancePass != null
            ? postProValues.useLuminancePass
            : true;

        this.bloomEffect.update(Renderer, occlusion);

        this.customKernel.material.uniforms.tInput2.value =
          this.bloomEffect.getTexture();
      }

      this.compute(this.customKernel, {
        input: source,
        output: target ? target : null,
        toScreen: target ? false : true,
      });
    } else if (effect == POST_TYPES.LOOK_UP_TABLE) {
      const currentLut = postProValues.image.path;

      if (this.lutKernel.currentLut != currentLut) {
        try {
          if (Textures[currentLut]) {
            const tex = Textures[currentLut];

            tex.minFilter = NearestFilter;
            tex.magFilter = LinearFilter;
            tex.generateMipmaps = false;
            tex.needsUpdate = true;

            this.lutKernel.material.uniforms.lutTexture.value =
              Textures[currentLut];
          } else {
            Textures.loadTexture({
              name: currentLut,
              url: currentLut,
            }).then(() => {
              if (this.lutKernel.currentLut == currentLut) {
                const tex = Textures[currentLut];

                if (tex != null) {
                  tex.minFilter = NearestFilter;
                  tex.magFilter = LinearFilter;
                  tex.generateMipmaps = false;
                  tex.needsUpdate = true;

                  this.lutKernel.material.uniforms.lutTexture.value = tex;
                }
              }
            });
          }

          this.lutKernel.currentLut = currentLut;
        } catch (e) {}
      }

      this.compute(this.lutKernel, {
        input: source,
        output: target ? target : null,
        toScreen: target ? false : true,
      });
    } else if (effect == POST_TYPES.TRIPPY) {
      this.trippyKernel.material.uniforms.speed.value = postProValues.speed;

      this.compute(this.trippyKernel, {
        input: source,
        output: target ? target : null,
        toScreen: target ? false : true,
      });
    } else if (effect == POST_TYPES.TV) {
      this.tvKernel.material.uniforms.vignetteFallOff.value =
        postProValues.vignetteFallOff;
      this.tvKernel.material.uniforms.vignetteStrength.value =
        postProValues.vignetteStrength;
      this.tvKernel.material.uniforms.glitchRatio.value =
        postProValues.glitchRatio;
      this.tvKernel.material.uniforms.amount.value = postProValues.amount;
      this.tvKernel.material.uniforms.strength.value = postProValues.strength;
      this.tvKernel.material.uniforms.speed.value = postProValues.speed;

      this.compute(this.tvKernel, {
        input: source,
        output: target ? target : null,
        toScreen: target ? false : true,
      });
    }

    // if( this.FXAA ) {

    // 	this.compute( this.FXAAKernel,  { input: this.FXAAtarget, output: t ? t: null, toScreen: t ? false : true } )

    // }

    // if(this.smaaPass){

    // 	this.smaaPass.render(source)

    // 	this.compute( this.blendKernel, { input: this.smaaPass.output, toScreen: true})
    // }
  }

  compute(kernel, opts = {}) {
    kernel.mesh.frustumCulled = false;

    kernel.mesh.matrixAutoUpdate = false;

    // if( opts.output == null ){

    // 	debugger;
    // }

    // if( opts.input == null ) {

    // 	debugger;
    // }

    // let oldRT = Renderer.getRenderTarget()

    if (kernel == null) {
      debugger;
    }

    this.kernels.add(kernel.mesh);

    if (opts.input) {
      kernel.mesh.material.uniforms.tInput.value = opts.input.texture;
    }

    if (opts.toScreen == true) {
      if (Renderer.getRenderTarget() != null) {
        Renderer.setRenderTarget(null);
      }

      if (Renderer.autoClear == false) {
        Renderer.clear(true, true, false);
      }

      Renderer.render(this.kernels, this.camera);
    } else {
      if (opts.output == null) {
        Renderer.setRenderTarget(kernel.output);
      } else {
        Renderer.setRenderTarget(opts.output);
      }

      Renderer.render(this.kernels, this.camera);
    }

    this.kernels.remove(kernel.mesh);
  }
  initPasses() {
    // bloom effect

    this.bloomEffect = new BloomEffect({
      // intensity: 5,
      mipmapBlur: true,
      resolutionScale: 0.25,
      luminanceThreshold: 0.23,
      luminanceSmoothing: 0.594,
      radius: 0.7,
    });

    this.bloomEffect.initialize({}, false, HalfFloatType);

    this.bloomEffect.mipmapBlurPass.scene.matrixWorldAutoUpdate = false;

    this.bloomEffect.luminancePass.scene.matrixWorldAutoUpdate = false;

    this.luminanceMaterial = this.bloomEffect.luminanceMaterial;

    this.blendKernel = {
      material: new ShaderMaterial({
        uniforms: {
          tInput: { value: null },

          tInput2: { value: null },

          intensity: { value: 5 },

          bloomColor: { value: new Color(0xffffff) },
        },

        vertexShader: BlendVert,

        fragmentShader: BlendFrag,

        depthTest: false,

        depthWrite: false,

        transparent: false,

        side: 0,
      }),
    };

    this.blendKernel.mesh = new Mesh(Triangle, this.blendKernel.material);

    // blend city kernel

    this.blendCityKernel = {
      material: new ShaderMaterial({
        uniforms: {
          // v_toneMappingExposure : {value: 2},

          // v_toneMappingWhitePoint: {value: 2},

          tInput: { value: null },

          tInput2: { value: null },

          intensity: { value: 5 },

          correctColor: { value: 0 },
        },

        vertexShader: BlendVert,

        fragmentShader: BlendCityFrag,

        depthTest: false,

        depthWrite: false,

        transparent: false,

        side: 0,
      }),
    };

    this.blendCityKernel.mesh = new Mesh(
      Triangle,
      this.blendCityKernel.material
    );

    // ssao blend

    // blend kernel

    // this.ssaoBlendKernel = {

    // 	material: new ShaderMaterial( {

    // 		uniforms: {

    // 			tInput  :    {  value: null },

    // 			tInput2 :    {  value: null },

    // 		},

    // 		vertexShader: BlendVert,

    // 		fragmentShader: BlendSSAOFrag,

    // 		depthTest: false,

    // 		depthWrite: false,

    // 		transparent: false,

    // 		side:0

    // 	})
    // }

    // this.ssaoBlendKernel.mesh = new Mesh(Triangle, this.ssaoBlendKernel.material)

    // TV Kernel

    this.tvKernel = {
      material: new ShaderMaterial({
        uniforms: {
          vignetteFallOff: {
            value: 0.5,
          },

          vignetteStrength: {
            value: 0.5,
          },

          dattime: Shared.timer,

          glitchRatio: {
            value: 0.5,
          },

          speed: {
            value: 1,
          },

          amount: {
            value: 1,
          },

          strength: {
            value: 1.0,
          },

          aspect: Shared.aspect,

          tInput: { value: null },
        },

        vertexShader: TVVert,

        fragmentShader: TVFrag,

        depthTest: false,

        depthWrite: false,

        transparent: false,

        side: 0,
      }),
    };

    this.tvKernel.mesh = new Mesh(Triangle, this.tvKernel.material);

    // this.luminanceKernel = {

    // 	material: new ShaderMaterial( {

    // 		uniforms: {

    // 			aspect  :    Shared.aspect,

    // 			tInput  :    {  value: null },

    // 			threshold: {

    // 				value: 0.5
    // 			},

    // 			smoothing: {

    // 				value: 0.5
    // 			},

    // 			range: { value: new Vector2(0.0, 1.0) }

    // 		},

    // 		defines : {

    // 			// RANGE: '1.0'
    // 			THRESHOLD: '1.0',
    // 			COLOR : '1.0'
    // 		},

    // 		vertexShader: LuminanceVert,

    // 		fragmentShader: LuminanceFrag,

    // 		depthTest: false,

    // 		depthWrite: false,

    // 		transparent: false,

    // 		side:0
    // 	}),

    // 	output: this.getFBO()
    // }

    // if( DEBUG ) {

    // 	GUI.add(this.luminanceMaterial, 'threshold', 0, 1).name('threshold')
    // 	GUI.add(this.luminanceMaterial, 'smoothing', 0, 1).name('smoothing')
    // 	GUI.add(this.blendKernel.material.uniforms.intensity, 'value', 0, 5).name('intensity')
    // 	GUI.add(this.bloomEffect.mipmapBlurPass, 'radius', 0, 1).name('radius')
    // }

    // this.luminanceKernel.mesh = new Mesh(Triangle, this.luminanceKernel.material)

    // LUT kernel

    const neutralBase64 =
      "data:image/png;base64,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";
    const img = new Image();
    img.src = neutralBase64;

    const neutralTexture = new Texture(img);

    neutralTexture.minFilter = NearestFilter;
    neutralTexture.magFilter = LinearFilter;
    neutralTexture.generateMipmaps = false;
    neutralTexture.needsUpdate = true;

    // document.body.appendChild(img)

    this.lutKernel = {
      material: new ShaderMaterial({
        uniforms: {
          tInput: { value: null },

          lutTexture: { value: neutralTexture },
        },

        vertexShader: LutVert,

        fragmentShader: LutFrag,

        depthTest: false,

        depthWrite: false,

        transparent: true,

        side: 0,
      }),

      currentLut: null,
    };

    this.lutKernel.mesh = new Mesh(Triangle, this.lutKernel.material);

    this.trippyKernel = {
      material: new ShaderMaterial({
        uniforms: {
          tInput: { value: null },

          timer: Shared.timer,

          speed: { value: 0.1 },
        },

        vertexShader: TrippyVert,

        fragmentShader: TrippyFrag,

        depthTest: false,

        depthWrite: false,

        transparent: false,

        side: 0,
      }),
    };

    this.trippyKernel.mesh = new Mesh(Triangle, this.trippyKernel.material);

    this.FXAAKernel = {
      material: new ShaderMaterial({
        uniforms: {
          tInput: { value: null },

          resolution: { value: new Vector2(0, 0) },
        },

        vertexShader: BlendVert,

        fragmentShader: FXAAFrag,

        depthTest: false,

        depthWrite: false,

        transparent: false,

        side: 0,
      }),
    };

    this.FXAAKernel.mesh = new Mesh(Triangle, this.FXAAKernel.material);

    // SSAO Kernel

    // this.ssaoKernel = new SSAOKernel()
  }

  initCustomKernel(options) {
    const material = options.value.kernel;

    // material.onBeforeRender = ()=>{
    // }

    // material.onAfterRender = ()=>{
    // }

    // material.customProgramCacheKey = () =>{
    //     return material.onBeforeCompile.toString();
    // }

    const res = {
      material: material,

      mesh: new Mesh(Triangle, material),
    };

    return res;
  }

  resize(w, h, dpi) {
    this.width = w;

    this.height = h;

    // let i = 0

    // while(i < this.kernels.children.length ){

    // 	this.kernels.children[i].material.uniforms.resolution.value.set(w, h)

    // 	i++
    // }

    if (this.smaaPass) {
      this.smaaPass.resize(w, h);
    }

    // if( this.luminanceKernel ) {

    // 	this.luminanceKernel.output.setSize(w * dpi, h * dpi)
    // }

    if (this.bloomEffect) {
      this.bloomEffect.setSize(w * dpi, h * dpi);
    }

    if (this.ssaoKernel) {
      this.ssaoKernel.setSize(w, h, dpi);
    }

    if (this.FXAAtarget) {
      this.FXAAKernel.material.uniforms.resolution.value.set(
        (1.0 / w) * dpi,
        (1.0 / h) * dpi
      );

      this.FXAAtarget.setSize(w * dpi, h * dpi);
    }
  }

  getFBO() {
    return new WebGLRenderTarget(1, 1, {
      depthBuffer: false,
      stencilBuffer: false,
      generateMipmaps: false,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      // type: HalfFloatType
    });
  }
}
