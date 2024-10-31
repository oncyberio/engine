/**
 * @author spidersharma / http://eduperiment.com/
 Inspired from Unreal Engine::
 https://docs.unrealengine.com/latest/INT/Engine/Rendering/PostProcessEffects/Bloom/
 */

import * as THREE from "three";

import Renderer from "@3renderer";

import gui from "@3gui";

import { FBO_DEBUG, DEBUG } from "engine/constants";

import FBOHelper from "@3gl/globals/fbohelper.js";

var resx, resy;

let opts = {
    threshold: 0,

    bloomStrength: 0,

    bloomRadius: 0,
};

const bloomFactors = [1.0, 0.8, 0.6, 0.4, 0.2];

const kernelSizeArray = [3, 5, 7, 9, 11];

import Triangle from "@3gl/globals/triangle";

import SeperableBlurMaterialVertex from "./shaders/vert.glsl";

import SeperableBlurMaterialFragment from "./shaders/frag.glsl";

import SeperableBlurMaterialVertexLow from "./shaders/vertlow.glsl";

import SeperableBlurMaterialFragmentLow from "./shaders/fraglow.glsl";

import CompositeMaterialVertex from "./shaders/composite.vert";

import CompositeMaterialFragment from "./shaders/composite.frag";

export default class UnrealBloomPass {
    constructor(options) {
        this.power = 1;

        this.currentDPI = 1;

        this.lowvarying = options.lowvarying;
        // this.lowvarying = true

        this.scene = new THREE.Scene();

        this.scene.matrixWorldAutoUpdate = false;

        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        this.strength = options.strength;

        this.radius = options.radius;

        this.resolution = new THREE.Vector2(1, 1);

        // render targets
        var opts = {
            minFilter: THREE.LinearFilter,

            magFilter: THREE.LinearFilter,

            type: THREE.HalfFloatType,

            depthBuffer: false,

            // stencilBuffer: true
            stencilBuffer: false,
        };

        this.renderTargetsHorizontal = [];

        this.renderTargetsVertical = [];

        this.nMips = 5;

        resx = Math.round(this.resolution.x / 2);

        resy = Math.round(this.resolution.y / 2);

        let i = 0;

        while (i < this.nMips) {
            var renderTarget = new THREE.WebGLRenderTarget(
                resx,

                resy,
                opts,
            );

            renderTarget.texture.name = "UnrealBloomPass.h" + i;

            renderTarget.texture.generateMipmaps = false;

            if (FBO_DEBUG) {
                //FBOHelper.attach(renderTarget, "UnrealBloomPass.h" + i)
            }

            this.renderTargetsHorizontal.push(renderTarget);

            var renderTarget = new THREE.WebGLRenderTarget(resx, resy, opts);

            renderTarget.texture.name = "UnrealBloomPass.v" + i;

            renderTarget.texture.generateMipmaps = false;

            if (FBO_DEBUG) {
                //FBOHelper.attach(renderTarget, "UnrealBloomPass.v" + i)
            }

            this.renderTargetsVertical.push(renderTarget);

            resx = Math.round(resx / 2);

            resy = Math.round(resy / 2);

            i++;
        }

        this.separableBlurMaterials = [];

        var resx = Math.round(this.resolution.x / 2);

        var resy = Math.round(this.resolution.y / 2);

        i = 0;

        while (i < this.nMips) {
            this.separableBlurMaterials.push(
                this.getSeperableBlurMaterial(kernelSizeArray[i]),
            );

            resx = Math.round(resx / 2);

            resy = Math.round(resy / 2);

            i++;
        }

        this.compositeMaterial = this.getCompositeMaterial(this.nMips);

        this.compositeMaterial.uniforms.blurTexture1.value =
            this.renderTargetsVertical[0].texture;

        this.compositeMaterial.uniforms.blurTexture2.value =
            this.renderTargetsVertical[1].texture;

        this.compositeMaterial.uniforms.blurTexture3.value =
            this.renderTargetsVertical[2].texture;

        this.compositeMaterial.uniforms.blurTexture4.value =
            this.renderTargetsVertical[3].texture;

        this.compositeMaterial.uniforms.blurTexture5.value =
            this.renderTargetsVertical[4].texture;

        this.compositeMaterial.needsUpdate = true;

        opts.bloomStrength = this.strength;

        opts.bloomRadius = this.radius;

        this.output = this.renderTargetsHorizontal[0];

        if (DEBUG) {
            let folder = gui.addFolder("postprocessing");

            folder.add(this, "strength").step(0.01);

            folder
                .add(this, "radius")
                .step(0.01)
                .onChange((val) => {
                    this.radius = val;
                });

            folder.add(this, "power", 0, 1).step(0.01);
        }
    }

    setSize(width, height, dpi) {
        if (dpi >= 2) {
            // width 	*= 0.5
            // height 	*= 0.5
        }

        var resx = Math.round(width);
        var resy = Math.round(height);

        let i = 0;
        while (i < this.nMips) {
            this.renderTargetsHorizontal[i].setSize(resx, resy);
            this.renderTargetsVertical[i].setSize(resx, resy);

            this.separableBlurMaterials[i].uniforms.invSize.value.set(
                1.0 / resx,
                1.0 / resy,
            );

            if (dpi > 1) {
                resx = Math.round(resx / 2.5);
                resy = Math.round(resy / 2.5);
            } else {
                resx = Math.round(resx / 2.0);
                resy = Math.round(resy / 2.0);
            }

            i++;
        }

        this.currentDPI = dpi;
    }

    render(readBuffer) {
        let oldAutoClear = Renderer.autoClear;

        Renderer.autoClear = false;

        var inputRenderTarget = readBuffer;

        let i = 0;

        while (i < this.nMips) {
            if (this.quad != null) {
                this.quad.material = this.separableBlurMaterials[i];
            } else {
                this.quad = new THREE.Mesh(
                    Triangle,
                    this.separableBlurMaterials[i],
                );

                this.quad.frustumCulled = false;

                this.quad.matrixAutoUpdate = false;

                this.scene.add(this.quad);
            }

            this.separableBlurMaterials[i].uniforms.colorTexture.value =
                inputRenderTarget.texture;

            this.separableBlurMaterials[i].uniforms.direction.value.set(
                1.0,
                0.0,
            );

            Renderer.setRenderTarget(this.renderTargetsHorizontal[i]);

            // Renderer.renderBufferDirect( this.camera, this.scene, this.quad.geometry, this.separableBlurMaterials[i], this.quad )

            Renderer.clear(true, true, false);

            Renderer.render(this.scene, this.camera);

            this.separableBlurMaterials[i].uniforms.colorTexture.value =
                this.renderTargetsHorizontal[i].texture;

            this.separableBlurMaterials[i].uniforms.direction.value.set(0, 1.0);

            Renderer.setRenderTarget(this.renderTargetsVertical[i]);

            Renderer.clear(true, true, false);

            Renderer.render(this.scene, this.camera);

            inputRenderTarget = this.renderTargetsHorizontal[i];

            i++;
        }

        // Composite All the mips
        this.quad.material = this.compositeMaterial;

        this.compositeMaterial.uniforms.bloomStrength.value =
            this.strength * this.power * (0.5 * this.currentDPI);

        this.compositeMaterial.uniforms.bloomRadius.value =
            this.radius * this.power * (0.5 * this.currentDPI);

        Renderer.setRenderTarget(this.renderTargetsHorizontal[0]);

        Renderer.clear(true, true, false);

        Renderer.render(this.scene, this.camera);

        Renderer.autoClear = oldAutoClear;
    }

    getSeperableBlurMaterial(kernelRadius) {
        let defines = {
            KERNEL_RADIUS: kernelRadius,
            SIGMA: kernelRadius,
        };

        if (kernelRadius >= 5) {
            defines["KERNEL_RADIUS_5"] = "";
        }

        if (kernelRadius >= 7) {
            defines["KERNEL_RADIUS_7"] = "";
        }

        if (kernelRadius >= 9) {
            defines["KERNEL_RADIUS_9"] = "";
        }

        if (kernelRadius >= 11) {
            defines["KERNEL_RADIUS_11"] = "";
        }

        return new THREE.ShaderMaterial({
            side: 0,

            defines: defines,

            depthTest: false,

            depthWrite: false,

            uniforms: {
                colorTexture: { value: null },

                invSize: { value: new THREE.Vector2(0.5, 0.5) },

                direction: { value: new THREE.Vector2(0.5, 0.5) },
            },

            vertexShader: SeperableBlurMaterialVertexLow,

            fragmentShader: SeperableBlurMaterialFragmentLow,
        });
    }

    getCompositeMaterial(nMips) {
        return new THREE.ShaderMaterial({
            side: 0,

            depthTest: false,

            depthWrite: false,

            defines: {
                BLOOM_FACTOR_0: "" + bloomFactors[0].toFixed(1) + "",
                BLOOM_FACTOR_1: "" + bloomFactors[1].toFixed(1) + "",
                BLOOM_FACTOR_2: "" + bloomFactors[2].toFixed(1) + "",
                BLOOM_FACTOR_3: "" + bloomFactors[3].toFixed(1) + "",
                BLOOM_FACTOR_4: "" + bloomFactors[4].toFixed(1) + "",
            },

            uniforms: {
                blurTexture1: { value: null },
                blurTexture2: { value: null },
                blurTexture3: { value: null },
                blurTexture4: { value: null },
                blurTexture5: { value: null },
                bloomStrength: { value: 1.0 },
                bloomRadius: { value: 0.0 },
            },

            vertexShader: CompositeMaterialVertex,

            fragmentShader: CompositeMaterialFragment,
        });
    }

    dispose() {
        let i = 0;

        while (i < this.renderTargetsHorizontal.length()) {
            this.renderTargetsHorizontal[i].dispose();
            this.renderTargetsHorizontal[i] = null;
            i++;
        }
        while (i < this.renderTargetsVertical.length()) {
            this.renderTargetsVertical[i].dispose();
            this.renderTargetsVertical[i] = null;
            i++;
        }
    }
}
