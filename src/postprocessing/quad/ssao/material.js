import {
    NoBlending,
    ShaderMaterial,
    Uniform,
    Vector2,
    Vector4,
    Vector3,
} from "three";

import fragmentShader from "./shaders/frag.glsl";

import vertexShader from "./shaders/vert.glsl";

import Shared from "engine/globals/shared";

/**
 * An upsampling material.
 *
 * Based on an article by Fabrice Piquet:
 * https://www.froyok.fr/blog/2021-12-ue4-custom-bloom/
 *
 * @implements {Resizable}
 */

export default class SSAOMaterial extends ShaderMaterial {
    /**
     * Constructs a new upsampling material.
     */

    constructor(opts) {
        super({
            name: "SSAOMaterial",
            uniforms: {
                texture_depth: {
                    value: null,
                },
                resolution: {
                    value: new Vector2(1, 1),
                },

                is_ortho: {
                    value: false,
                },

                near: {
                    value: 0,
                },

                far: {
                    value: 1,
                },

                proj_info: {
                    value: new Vector4(),
                },

                radius_of_influence: {
                    value: 8,
                },
                radius_in_screen_space: {
                    value: 1,
                },

                exponent: {
                    value: 1,
                },

                ao_color: {
                    value: new Vector3(0.0025, 0.0001, 0.0052),
                },

                bias: {
                    value: 0.15,
                },

                frame_index: {
                    value: 0,
                },

                texture_blue_noise_in_disk: {
                    value: null,
                },

                texture_blue_noise: {
                    value: null,
                },

                projectionMatrixInverse: { value: null },

                cameraMatrixWorld: { value: null },
            },
            blending: NoBlending,
            depthWrite: false,
            depthTest: false,
            fragmentShader,
            vertexShader,
        });
    }
}
