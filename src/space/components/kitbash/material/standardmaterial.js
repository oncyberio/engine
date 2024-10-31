import SuffFrag from "./shaders/frag.suff.glsl";

import Shared from "engine/globals/shared.js";

import InstancedStandard from "engine/materials/instancedstandard";

export default class InstancedStandardMaterial extends InstancedStandard {
    constructor(block, data = {}) {
        let opts = {
            
            name: block.name,

            fragmentShaderHooks: {
                suffix: SuffFrag,
            },

            uniforms: {

                metalness: { value: 0.0 },

                roughness: { value: 1.0 },

                envMapIntensity: { value: 0 },
            },

            defines: {
                INSTANCE: "",
            },
        };

        let needsRotate = block.name.includes("rotate")

        if (needsRotate) {
            opts.defines["ROTATING"] = "";

            opts.uniforms.timer = Shared.timer_d2;
        }

        opts.plugins = data.plugins

        super(opts);

        this.copy(block.material);

        this.envMapIntensity = 0;

        this.roughness = 0;

        this.metalness = 0;

        if (this.transparent && this.opacity > 0) {
            this.forceSinglePass = false;
        }

        this.occlusionMaterial = new InstancedStandard(opts);

        this.occlusionMaterial.copy(block.material);

        this.occlusionMaterial.roughness = 0;

        this.occlusionMaterial.metalness = 0;

        this.occlusionMaterial.envMapIntensity = 0;
    }
}
