import {
    SRGBColorSpace,
    UnsignedByteType,
    Vector2,
    WebGLRenderTarget,
    Scene,
    Camera,
    Mesh,
    BufferGeometry,
    BufferAttribute,
} from "three";
import DownsamplingMaterial from "./materials/downsamplingmaterial.js";
import UpsamplingMaterial from "./materials/upsamplingmaterial.js";

import Renderer from "@3renderer";
// import { Pass } from "./Pass";

/**
 * A blur pass that produces a wide blur by downsampling and upsampling the input over multiple MIP levels.
 *
 * Based on an article by Fabrice Piquet:
 * https://www.froyok.fr/blog/2021-12-ue4-custom-bloom/
 */
let geometry = null;

function getFullscreenTriangle() {
    if (geometry === null) {
        const vertices = new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]);
        const uvs = new Float32Array([0, 0, 2, 0, 0, 2]);
        geometry = new BufferGeometry();

        // Added for backward compatibility (setAttribute was added in three r110).
        if (geometry.setAttribute !== undefined) {
            geometry.setAttribute("position", new BufferAttribute(vertices, 3));
            geometry.setAttribute("uv", new BufferAttribute(uvs, 2));
        } else {
            geometry.addAttribute("position", new BufferAttribute(vertices, 3));
            geometry.addAttribute("uv", new BufferAttribute(uvs, 2));
        }
    }

    return geometry;
}

export default class MipmapBlurPass {
    /**
     * Constructs a new mipmap blur pass.
     *
     * @param {Object} [options] - The options.
     */

    constructor(opts = {}) {
        this.scene = new Scene();

        this.camera = new Camera();

        this.screen = null;

        // this.screen = new Mesh(getFullscreenTriangle(), value);
        // this.screen.frustumCulled = false;
        /**
         * The output render target.
         *
         * @type {WebGLRenderTarget}
         * @private
         */

        this.renderTarget = new WebGLRenderTarget(1, 1, { depthBuffer: false });
        this.renderTarget.texture.name = "Upsampling.Mipmap0";

        /**
         * The mipmaps used for downsampling.
         *
         * @type {WebGLRenderTarget[]}
         * @readonly
         */

        this.downsamplingMipmaps = [];

        /**
         * The mipmaps used for upsampling.
         *
         * @type {WebGLRenderTarget[]}
         * @readonly
         */

        this.upsamplingMipmaps = [];

        /**
         * A downsampling material.
         *
         * @type {DownsamplingMaterial}
         * @private
         */

        this.downsamplingMaterial = new DownsamplingMaterial();

        /**
         * An upsampling material.
         *
         * @type {UpsamplingMaterial}
         * @private
         */

        this.upsamplingMaterial = new UpsamplingMaterial();

        /**
         * The current resolution.
         *
         * @type {Vector2}
         * @private
         */

        this.resolution = new Vector2();

        this.initialize(opts);

        this.levels = opts.levels;
    }

    /**
     * A texture that contains the blurred result.
     *
     * @type {Texture}
     */

    get texture() {
        return this.renderTarget.texture;
    }

    /**
     * The MIP levels. Default is 8.
     *
     * @type {Number}
     */

    get levels() {
        return this.downsamplingMipmaps.length;
    }

    set levels(value) {
        if (this.levels !== value) {
            const renderTarget = this.renderTarget;

            this.dispose();
            this.downsamplingMipmaps = [];
            this.upsamplingMipmaps = [];

            for (let i = 0; i < value; ++i) {
                const mipmap = renderTarget.clone();
                mipmap.texture.name = "Downsampling.Mipmap" + i;
                this.downsamplingMipmaps.push(mipmap);
            }

            this.upsamplingMipmaps.push(renderTarget);

            for (let i = 1, l = value - 1; i < l; ++i) {
                const mipmap = renderTarget.clone();
                mipmap.texture.name = "Upsampling.Mipmap" + i;
                this.upsamplingMipmaps.push(mipmap);
            }

            this.setSize(this.resolution.x, this.resolution.y);
        }
    }

    /**
     * The blur radius.
     *
     * @type {Number}
     */

    get radius() {
        return this.upsamplingMaterial.radius;
    }

    set radius(value) {
        this.upsamplingMaterial.radius = value;
    }

    /**
     * Renders the blur.
     *
     * @param {WebGLRenderer} renderer - The renderer.
     * @param {WebGLRenderTarget} inputBuffer - A frame buffer that contains the result of the previous pass.
     * @param {WebGLRenderTarget} outputBuffer - A frame buffer that serves as the output render target unless this pass renders to screen.
     * @param {Number} [deltaTime] - The time between the last frame and the current one in seconds.
     * @param {Boolean} [stencilTest] - Indicates whether a stencil mask is active.
     */

    render(inputBuffer) {
        const { scene, camera } = this;
        const { downsamplingMaterial, upsamplingMaterial } = this;
        const { downsamplingMipmaps, upsamplingMipmaps } = this;

        let previousBuffer = inputBuffer;

        // Downsample the input to the highest MIP level (smallest mipmap).
        this.fullscreenMaterial = downsamplingMaterial;

        for (let i = 0, l = downsamplingMipmaps.length; i < l; ++i) {
            const mipmap = downsamplingMipmaps[i];
            downsamplingMaterial.setSize(
                previousBuffer.width,
                previousBuffer.height,
            );
            downsamplingMaterial.inputBuffer = previousBuffer.texture;
            Renderer.setRenderTarget(mipmap);
            Renderer.render(scene, camera);

            previousBuffer = mipmap;
        }

        // Upsample the result back to the lowest MIP level (largest mipmap, half resolution).
        this.fullscreenMaterial = upsamplingMaterial;

        // A + B = C, then D + C = F, etc.
        for (let i = upsamplingMipmaps.length - 1; i >= 0; --i) {
            const mipmap = upsamplingMipmaps[i];
            upsamplingMaterial.setSize(
                previousBuffer.width,
                previousBuffer.height,
            );
            upsamplingMaterial.inputBuffer = previousBuffer.texture;
            upsamplingMaterial.supportBuffer = downsamplingMipmaps[i].texture;
            Renderer.setRenderTarget(mipmap);
            Renderer.render(scene, camera);
            previousBuffer = mipmap;
        }
    }

    get fullscreenMaterial() {
        return this.screen !== null ? this.screen.material : null;
    }

    set fullscreenMaterial(value) {
        let screen = this.screen;

        if (screen !== null) {
            screen.material = value;
        } else {
            screen = new Mesh(getFullscreenTriangle(), value);
            screen.frustumCulled = false;

            if (this.scene === null) {
                this.scene = new Scene();
            }

            this.scene.add(screen);
            this.screen = screen;
        }
    }

    /**
     * Updates the size of this pass.
     *
     * @param {Number} width - The width.
     * @param {Number} height - The height.
     */

    setSize(width, height) {
        const resolution = this.resolution;
        resolution.set(width, height);

        let w = resolution.width,
            h = resolution.height;

        for (let i = 0, l = this.downsamplingMipmaps.length; i < l; ++i) {
            w = Math.round(w * 0.5);
            h = Math.round(h * 0.5);

            this.downsamplingMipmaps[i].setSize(w, h);

            if (i < this.upsamplingMipmaps.length) {
                this.upsamplingMipmaps[i].setSize(w, h);
            }
        }
    }

    /**
     * Performs initialization tasks.
     *
     * @param {WebGLRenderer} renderer - The renderer.
     * @param {Boolean} alpha - Whether the renderer uses the alpha channel or not.
     * @param {Number} frameBufferType - The type of the main frame buffers.
     */

    initialize(opts = {}) {
        if (opts.frameBufferType !== undefined) {
            const mipmaps = this.downsamplingMipmaps.concat(
                this.upsamplingMipmaps,
            );

            for (const mipmap of mipmaps) {
                mipmap.texture.type = opts.frameBufferType;
            }

            if (opts.frameBufferType !== UnsignedByteType) {
                this.downsamplingMaterial.defines.FRAMEBUFFER_PRECISION_HIGH =
                    "1";
                this.upsamplingMaterial.defines.FRAMEBUFFER_PRECISION_HIGH =
                    "1";
            } else if (Renderer.outputEncoding === SRGBColorSpace) {
                for (const mipmap of mipmaps) {
                    mipmap.texture.colorSpace = SRGBColorSpace;
                }
            }
        }
    }

    /**
     * Deletes internal render targets and textures.
     */

    dispose() {
        for (const mipmap of this.downsamplingMipmaps.concat(
            this.upsamplingMipmaps,
        )) {
            mipmap.dispose();
        }
    }
}
