import { Color } from "three";

// instance model materials

import InstancedLambert from "engine/materials/instancedlambert";

import InstancedStandard from "engine/materials/instancedstandard";

import InstancedShadow from "engine/materials/instancedshadow";

import InstancedOcclusion from "engine/materials/instancedocclusion/index.js";

import InstancedBasic from "engine/materials/instancedbasic";

import InstancedToon from "engine/materials/instancedtoon";

import InstancedOutline from "engine/materials/instancedoutline";

import {
    InstancedGlitchLambert,
    InstancedGlitchBasic,
} from "engine/materials/instancedglitch";

import {
    InstancedGhostBasic,
    InstancedGhostLambert,
} from "engine/materials/instancedghost";

// =<

// classic model materials

import MeshToonMaterial from "engine/materials/toon";

import MeshOutlineMaterial from "engine/materials/outline";

import { GlitchBasic, GlitchLambert } from "engine/materials/glitch";

import { GhostBasic, GhostLambert } from "engine/materials/ghost";

import PipeLineMesh from "engine/abstract/pipelinemesh";

import PipeLineSkinnedMesh from "engine/abstract/pipelineskinnedmesh";

import InstancedPipelineMesh from "engine/abstract/instancedpipelinemesh";

import { RENDER_MODES } from "./constants";

import { CAMERA_LAYERS } from "engine/constants";

import { SkinnedMesh, MeshBasicMaterial } from "three";

import InstanceOpacityPlugin from "engine/libraries/visuals/instanceopacity";

const instanceOpacityPlugin = new InstanceOpacityPlugin();

class ModelPipeline {
    // assign for VRMS

    get(mesh, geometry, originalMaterial, opts) {
        var newMesh = mesh;

        if (opts.instance) {
            return this.assingModelInstance(
                newMesh,
                geometry,
                originalMaterial,
                opts
            );
        } else {
            return this.assignModelDefault(
                newMesh,
                geometry,
                originalMaterial,
                opts
            );
        }
    }

    // assign instance vrm

    assingModelInstance(mesh, geometry, originalMaterial, opts) {
        opts.plugins = opts.plugins || [];

        let useTransparency = opts.useTransparency;

        // override transparency if asked
        if (
            opts.useTransparency == true ||
            opts.renderMode == RENDER_MODES.ERROR ||
            opts.renderMode == RENDER_MODES.GHOST
        ) {
            useTransparency = true;
        }

        // override transparency sorting if asked

        geometry.transparencySorting = useTransparency;

        var newMesh = mesh;

        if (useTransparency == true) {
            opts.plugins.push(instanceOpacityPlugin);
        }

        var diffuseMaterial = opts.useStandard
            ? new InstancedStandard({ plugins: opts.plugins })
            : new InstancedBasic({ plugins: opts.plugins });

        diffuseMaterial.copy(originalMaterial);

        var lightingMaterial;

        switch (opts.renderMode) {
            case RENDER_MODES.SELECT:
                lightingMaterial =
                    originalMaterial.type == "MeshLambertMaterial"
                        ? new InstancedLambert({ plugins: opts.plugins })
                        : new InstancedStandard({ plugins: opts.plugins });

                lightingMaterial.copy(originalMaterial);

                var outLineMaterial = new InstancedOutline(opts);

                outLineMaterial.uniforms.outlineColor.value.setHex(0x00ff00);

                diffuseMaterial = [lightingMaterial, outLineMaterial];

                lightingMaterial = [lightingMaterial, outLineMaterial];

                break;

            // Multi render

            case RENDER_MODES.TOON:
                lightingMaterial = new InstancedToon(opts);

                lightingMaterial.copy(originalMaterial);

                lightingMaterial.depthTest = true;

                lightingMaterial.depthWrite = true;

                var outLineMaterial = new InstancedOutline(opts);

                outLineMaterial.transparent = true && useTransparency;

                diffuseMaterial = [lightingMaterial, outLineMaterial];

                lightingMaterial = [lightingMaterial, outLineMaterial];

                break;

            case RENDER_MODES.GLITCH:
                diffuseMaterial = new InstancedGlitchBasic(opts);
                diffuseMaterial.copy(originalMaterial);

                lightingMaterial = new InstancedGlitchLambert(opts);
                lightingMaterial.copy(originalMaterial);

                diffuseMaterial.transparent = true && useTransparency;
                lightingMaterial.transparent = true && useTransparency;

                break;

            case RENDER_MODES.GHOST:
            case RENDER_MODES.ERROR:
                // override transparency sorting

                // geometry.transparencySorting = true

                const parameters = {
                    uniforms: {
                        rimPower: {
                            value:
                                opts.renderMode == RENDER_MODES.ERROR
                                    ? 0.5
                                    : 1.0,
                        },
                        minAlpha: {
                            value:
                                opts.renderMode == RENDER_MODES.ERROR
                                    ? 0.2
                                    : 0.05,
                        },
                    },
                    plugins: opts.plugins,
                };

                diffuseMaterial = new InstancedGhostBasic(parameters);

                diffuseMaterial.copy(originalMaterial);

                lightingMaterial = new InstancedGhostLambert(parameters);

                lightingMaterial.copy(originalMaterial);

                if (opts.renderMode == RENDER_MODES.ERROR) {
                    diffuseMaterial.color.setHex(0xff0000);
                    lightingMaterial.color.setHex(0xff0000);
                }

                diffuseMaterial.transparent = true && useTransparency;
                lightingMaterial.transparent = true && useTransparency;

                diffuseMaterial.side = 0;
                lightingMaterial.side = 0;

                break;

            default:
                lightingMaterial =
                    originalMaterial.type == "MeshLambertMaterial"
                        ? new InstancedLambert({ plugins: opts.plugins })
                        : new InstancedStandard({ plugins: opts.plugins });

                lightingMaterial.copy(originalMaterial);

                // debugger;

                if (opts.envmapIntensity) {
                    // @ts-ignore
                    lightingMaterial.envMapIntensity = opts.envmapIntensity;
                }

                break;
        }

        if (!(newMesh instanceof InstancedPipelineMesh)) {
            globalThis.ll = lightingMaterial;

            newMesh = new InstancedPipelineMesh(geometry, diffuseMaterial, {
                type: "",

                visibleOnDiffuse: opts.pipelineOptions.visibleOnDiffuse,
                visibleOnOcclusion: opts.pipelineOptions.visibleOnOcclusion,
                visibleOnMirror: opts.pipelineOptions.visibleOnMirror,
                lightingMaterial: lightingMaterial,
                occlusionMaterial: diffuseMaterial,
                lightingOcclusionMaterial: lightingMaterial,
            });
        } else {
            newMesh.updateMaterials(diffuseMaterial, {
                visibleOnDiffuse: opts.pipelineOptions.visibleOnDiffuse,
                visibleOnOcclusion: opts.pipelineOptions.visibleOnOcclusion,
                visibleOnMirror: opts.pipelineOptions.visibleOnMirror,
                lightingMaterial: lightingMaterial,
                occlusionMaterial: diffuseMaterial,
                lightingOcclusionMaterial: lightingMaterial,
            });
        }

        const geo = newMesh.geometry;

        newMesh.geometry.groups = [];

        switch (opts.renderMode) {
            case RENDER_MODES.TOON:
            case RENDER_MODES.SELECT:
                newMesh.geometry.groups = [
                    { start: 0, count: geo.index.count, materialIndex: 0 },
                    { start: 0, count: geo.index.count, materialIndex: 1 },
                ];

                break;
        }

        newMesh.customDepthMaterial = new InstancedShadow();

        newMesh.customDepthMaterial.map = originalMaterial.map;
        newMesh.customDepthMaterial.alphaTest = originalMaterial.alphaTest;

        newMesh.castShadow = true;
        newMesh.receiveShadow = true;

        if (opts.enableRealTimeShadow == true) {
            newMesh.layers.disableAll();

            newMesh.layers.set(CAMERA_LAYERS.DYNAMIC);
        }

        newMesh.frustumCulled = false;

        newMesh.matrixAutoUpdate = false;

        newMesh.matrixWorldAutoUpdate = false;

        return newMesh;
    }

    assignModelDefault(mesh, geometry, originalMaterial, opts) {
        var newMesh = mesh;

        var diffuseMaterial = originalMaterial;

        if (opts.useTransparency == true) {
            originalMaterial.transparent = true;
        }

        var lightingMaterial;

        switch (opts.renderMode) {
            case RENDER_MODES.GLITCH:
                diffuseMaterial = new GlitchBasic();
                diffuseMaterial.copy(originalMaterial);

                lightingMaterial = new GlitchLambert();
                lightingMaterial.copy(originalMaterial);

                break;

            // Multi render

            case RENDER_MODES.TOON:
                lightingMaterial = new MeshToonMaterial(opts);

                lightingMaterial.copy(originalMaterial);

                lightingMaterial.depthTest = true;

                lightingMaterial.depthWrite = true;

                var outLineMaterial = new MeshOutlineMaterial(opts);

                diffuseMaterial = [lightingMaterial, outLineMaterial];

                lightingMaterial = [lightingMaterial, outLineMaterial];

                break;

            case RENDER_MODES.GHOST:
            case RENDER_MODES.ERROR:
                const parameters = {
                    uniforms: {
                        rimPower: {
                            value:
                                opts.renderMode == RENDER_MODES.ERROR
                                    ? 0.5
                                    : 1.0,
                        },
                        minAlpha: {
                            value:
                                opts.renderMode == RENDER_MODES.ERROR
                                    ? 0.2
                                    : 0.05,
                        },
                    },
                };

                diffuseMaterial = new GhostBasic(parameters);

                diffuseMaterial.copy(originalMaterial);

                lightingMaterial = new GhostLambert(parameters);

                lightingMaterial.copy(originalMaterial);

                if (opts.renderMode == RENDER_MODES.ERROR) {
                    diffuseMaterial.color.setHex(0xff0000);
                    lightingMaterial.color.setHex(0xff0000);
                }

                diffuseMaterial.transparent = true;
                lightingMaterial.transparent = true;

                diffuseMaterial.side = 0;
                lightingMaterial.side = 0;

                break;

            default:
                lightingMaterial = originalMaterial;

                if (opts.envmapIntensity) {
                    // @ts-ignore
                    lightingMaterial.envMapIntensity = opts.envmapIntensity;
                }

                break;
        }

        const occlusionMaterial = new MeshBasicMaterial({
            side: 2,
            color: 0x000000,
        });

        var meshConstructor =
            newMesh instanceof SkinnedMesh ? PipeLineSkinnedMesh : PipeLineMesh;

        newMesh = new meshConstructor(geometry, diffuseMaterial, {
            type: "",
            visibleOnDiffuse: opts.pipelineOptions.visibleOnDiffuse,
            visibleOnOcclusion: opts.pipelineOptions.visibleOnOcclusion,
            visibleOnMirror: opts.pipelineOptions.visibleOnMirror,
            occlusionMaterial: occlusionMaterial,
            lightingMaterial: lightingMaterial,
            lightingOcclusionMaterial: occlusionMaterial,
        });

        const geo = newMesh.geometry;

        newMesh.geometry.groups = [];

        switch (opts.renderMode) {
            // setup multi render

            case RENDER_MODES.TOON:
                newMesh.geometry.groups = [
                    { start: 0, count: geo.index.count, materialIndex: 0 },
                    { start: 0, count: geo.index.count, materialIndex: 1 },
                ];

                break;
        }

        newMesh.castShadow = true;

        newMesh.receiveShadow = true;

        // newMesh.layers.disableAll()

        // newMesh.layers.set( CAMERA_LAYERS.DYNAMIC )

        // newMesh.frustumCulled = false

        // newMesh.matrixAutoUpdate = false;

        // newMesh.matrixWorldAutoUpdate = false

        return newMesh;
    }
}

export default new ModelPipeline();
