import { NoBlending, ShaderMaterial, Uniform, Vector2 } from "three";

import fragmentShader from "./glsl/convolution.downsampling.frag";
import vertexShader from "./glsl/convolution.downsampling.vert";

/**
 * A downsampling material.
 *
 * Based on an article by Fabrice Piquet:
 * https://www.froyok.fr/blog/2021-12-ue4-custom-bloom/
 *
 * @implements {Resizable}
 */

export default class DownsamplingMaterial extends ShaderMaterial {
    /**
     * Constructs a new downsampling material.
     */

    constructor() {
        super({
            name: "DownsamplingMaterial",
            uniforms: {
                inputBuffer: new Uniform(null),
                texelSize: new Uniform(new Vector2()),
            },
            blending: NoBlending,
            depthWrite: false,
            depthTest: false,
            fragmentShader,
            vertexShader,
        });

        /** @ignore */
        this.toneMapped = false;
    }

    /**
     * The input buffer.
     *
     * @type {Texture}
     */

    set inputBuffer(value) {
        this.uniforms.inputBuffer.value = value;
    }

    /**
     * Sets the size of this object.
     *
     * @param {Number} width - The width.
     * @param {Number} height - The height.
     */

    setSize(width, height) {
        this.uniforms.texelSize.value.set(1.0 / width, 1.0 / height);
    }
}
