import SuffFrag from "./shaders/frag.suff.glsl";

import Shared from "engine/globals/shared.js";

import InstancedBasic from "engine/materials/instancedbasic";

export default class InstancedBasicMaterial extends InstancedBasic {
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

        let needsRotate = block.name.includes("rotate");

        if (needsRotate) {

            opts.defines["ROTATING"] = "";

            opts.uniforms.timer = Shared.timer_d2;
        }

        opts.plugins = data.plugins

        super(opts);

        this.copy(block.material);


        if (this.transparent && this.opacity > 0) {
            this.forceSinglePass = false;
        }

        this.occlusionMaterial = new InstancedBasic(opts);

        this.occlusionMaterial.copy(block.material);
    }
}
