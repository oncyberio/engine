// @ts-check

import {
    PlaneGeometry,
    MeshBasicMaterial,
    SRGBColorSpace,
    BufferGeometry,
    BufferAttribute,
    MeshStandardMaterial,
    LinearFilter,
    LinearMipmapLinearFilter,
    RepeatWrapping,
    Material,
    Mesh,
    NormalBufferAttributes,
    Object3DEventMap,
    RingGeometry,
    Box3,
} from "three";

import {
    SET_LIGHTING_STATE,
    CURRENT_LIGHTING_STATE,
} from "engine/lightingstate";

import PipeLineMesh from "engine/abstract/pipelinemesh";

import { Component3D, DataChangeOpts } from "engine/abstract/component3D";

import { MODES, SHADERS, textureOpts } from "./data";

import { DisposePipelinesMeshes } from "engine/utils/dispose.js";

// @ts-ignore
import WorkerFloor from "./floor.worker.js";

import Loader from "engine/loader";

import GridMaterial from "./shaders/grid/diffuse.js";

import GridMaterialLighting from "./shaders/grid/lighting.js";

import BiplanarMaterial from "./shaders/biplanar/diffuse.js";

import BiplanarLightingMaterial from "./shaders/biplanar/lighting.js";

import {
    SET_SHADOW_NEEDS_UPDATE,
    WEB_WORKER_SUPPORT,
    WEBWORK_DELAY,
} from "engine/constants";

import { disposeThreeResources } from "engine/utils/dispose";
import { generateTerrainGeometry } from "./generategeometry";
import { TerrainEditor } from "./editor";
import { Assets } from "engine/assets";

export const SHADERS_MATERIALS = {
    grid: {
        diffuse: GridMaterial,

        lighting: GridMaterialLighting,
    },

    biplanar: {
        diffuse: BiplanarMaterial,

        lighting: BiplanarLightingMaterial,
    },
};

const updateGeometryProps = {
    scale: true,
    noiseEnabled: true,
    definition: true,
    smoothCenter: true,
    smoothLength: true,
    islandSmooth: true,
    islandLength: true,
    seed: true,
    noiseDomain: true,
    shape: true,
    innerRadius: true,
    visibleOnOcclusion: true,
};

const updateTextureProps = {
    scale: true,
    mode: true,
    shader: true,
    tiles: true,
    textureOpts: true,
    textureSideOpts: true,
    griddiv: true,
    edgeTransition: true,
    smoothAngle: true,
    noTileDisplacement: true,
    textureOptsCustom: true,
    textureSideOptsCustom: true,
};

const textureCache = {};

/**
 * @public
 *
 * Terrain component, used to create terrains in the game. Use the studio to add terrains to the space.
 */
export class TerrainComponent extends Component3D<any> {
    #worker: any;

    private materials = null;

    private mesh: PipeLineMesh = null;

    protected async init() {
        if (__BUILD_TARGET__ === "web" && WEB_WORKER_SUPPORT) {
            this.#worker = new WorkerFloor();
        }

        const geometry = new PlaneGeometry(1, 1, 10, 10);

        const occlusionMaterial = new MeshBasicMaterial({
            color: 0x000000,
            side: 2,
            fog: false,
        });

        this.materials = {
            diffuse: new MeshBasicMaterial({ color: 0xff0000, fog: true }),

            lighting: new MeshStandardMaterial({ fog: true }),
        };

        this.materials.lighting.envMapIntensity = 0;

        this.mesh = new PipeLineMesh(
            geometry,

            this.materials.diffuse,

            {
                visibleOnOcclusion: this.data.visibleOnOcclusion,

                occlusionMaterial: occlusionMaterial,

                lightingOcclusionMaterial: occlusionMaterial,

                lightingMaterial: this.materials.lighting,

                mirrorMaterial: this.materials.diffuse,
            }
        );

        this.mesh.castShadow = true;

        this.mesh.receiveShadow = true;

        this.mesh.name = "floor collision";

        this.add(this.mesh);

        this.geometryNeedsUpdate = true;

        this.textureNeedsUpdate = true;

        await this._update3D();
    }

    _onCreateCollisionMesh() {
        return this.mesh;
    }

    protected _getBBoxImp(box: Box3) {
        return box.expandByObject(this.mesh);
    }

    /**
     * @internal
     */
    onDataChange(opts: DataChangeOpts): void {
        console.log(opts);
        //
        for (const key in updateGeometryProps) {
            //
            if (opts.prev[key] !== this.data[key]) {
                //
                console.log("Geometry needs update");

                this.geometryNeedsUpdate = true;
            }
        }

        for (const key in updateTextureProps) {
            //
            if (opts.prev[key] !== this.data[key]) {
                //
                console.log("Texture needs update");

                this.textureNeedsUpdate = true;
            }
        }

        this._update3D(opts.isProgress);
    }

    private async _update3D(isProgress = false) {
        const { position, rotation, scale } = this.data;

        this.position.set(position.x, position.y, position.z);

        this.rotation.set(rotation.x, rotation.y, rotation.z);

        if (this.data.noiseEnabled) {
            this.scale.set(1, 1, 1);
        } else {
            this.scale.set(scale.x, scale.y, scale.z);
        }

        this.mesh.material.color.set(this.data.color);

        if (this.mesh.lightingMaterials.material) {
            this.mesh.lightingMaterials.material.color.set(this.data.color);
        }

        if (!isProgress) {
            let ps = [];

            if (this.geometryNeedsUpdate) {
                this.geometryNeedsUpdate = false;

                ps.push(this.computeGeometry());
            }

            if (__BUILD_TARGET__ === "web") {
                if (this.textureNeedsUpdate) {
                    console.log("update texture");

                    this.textureNeedsUpdate = false;

                    ps.push(this.updateTexturing());
                }
            }

            await Promise.all(ps);

            SET_SHADOW_NEEDS_UPDATE(true);
        }
    }

    /**
     * @internal
     */
    syncWithTransform(isProgress = false) {
        //
        this._assignXYZ("position", this.position);

        this._assignXYZ("rotation", this.rotation);
    }

    private geometryNeedsUpdate = false;

    private textureNeedsUpdate = false;

    private texAbort = null;

    private textureMap = null;

    private textureMapRatio = null;

    private textureSideMap = null;

    private textureSideMapRatio = null;

    private geoAbort = null;

    private async updateTexturing() {
        // const previousLightingState = CURRENT_LIGHTING_STATE

        // SET_LIGHTING_STATE( false )

        this.texAbort?.abort();

        this.texAbort = new AbortController();

        const signal = this.texAbort.signal;

        if (this.data.mode == MODES.texture) {
            this.mesh.diffuseMaterials.material = this.materials.diffuse;

            this.mesh.lightingMaterials.material = this.materials.lighting;

            this.mesh.diffuseMaterials.material.color.set(this.data.color);

            if (this.mesh.lightingMaterials.material) {
                this.mesh.lightingMaterials.material.color.set(this.data.color);
            }
        } else if (this.data.mode == MODES.color) {
            this.mesh.diffuseMaterials.material = this.materials.diffuse;

            this.mesh.lightingMaterials.material = this.materials.lighting;

            this.textureMap = null;

            this.mesh.diffuseMaterials.material.map =
                this.mesh.lightingMaterials.material.map = null;

            this.mesh.diffuseMaterials.material.needsUpdate =
                this.mesh.lightingMaterials.material.needsUpdate = true;

            this.mesh.diffuseMaterials.material.color.set(this.data.color);

            if (this.mesh.lightingMaterials.material) {
                this.mesh.lightingMaterials.material.color.set(this.data.color);
            }
        } else if (this.data.mode == MODES.shader) {
            if (this.materials[this.data.shader] == null) {
                this.materials[this.data.shader] = {
                    diffuse: new SHADERS_MATERIALS[this.data.shader].diffuse(
                        this.data
                    ),

                    lighting: new SHADERS_MATERIALS[this.data.shader].lighting(
                        this.data
                    ),
                };
            }

            this.mesh.diffuseMaterials.material =
                this.materials[this.data.shader].diffuse;

            this.mesh.lightingMaterials.material =
                this.materials[this.data.shader].lighting;

            this.materials[this.data.shader].diffuse.color.set(this.data.color);

            this.materials[this.data.shader].lighting.color.set(
                this.data.color
            );

            if (this.mesh.diffuseMaterials.material.uniforms.div) {
                this.mesh.diffuseMaterials.material.uniforms.div.value =
                    this.mesh.lightingMaterials.material.uniforms.div.value =
                        this.data.griddiv;
            }

            if (this.mesh.diffuseMaterials.material.edgeTransition != null) {
                this.mesh.diffuseMaterials.material.edgeTransition =
                    this.data.edgeTransition;
                this.mesh.lightingMaterials.material.edgeTransition =
                    this.data.edgeTransition;
                // this.mesh.lightingMaterials.material.uniforms.div.value =
                //     this.data.griddiv;
            }

            if (
                this.mesh.diffuseMaterials.material.noTileDisplacement != null
            ) {
                this.mesh.diffuseMaterials.material.noTileDisplacement =
                    this.data.noTileDisplacement;
                this.mesh.lightingMaterials.material.noTileDisplacement =
                    this.data.noTileDisplacement;
                // this.mesh.lightingMaterials.material.uniforms.div.value =
                //     this.data.griddiv;
            }

            if (this.mesh.diffuseMaterials.material.smoothAngle != null) {
                this.mesh.diffuseMaterials.material.smoothAngle =
                    this.data.smoothAngle;
                this.mesh.lightingMaterials.material.smoothAngle =
                    this.data.smoothAngle;
                // this.mesh.lightingMaterials.material.uniforms.div.value =
                //     this.data.griddiv;
            }

            this.mesh.diffuseMaterials.material.needsUpdate = true;

            this.mesh.lightingMaterials.material.needsUpdate = true;
        }

        // texturing
        if (
            this.data.mode === MODES.texture ||
            (this.data.mode == MODES.shader &&
                this.data.shader == SHADERS.biplanar)
        ) {
            // path = actual , image = default when custom is null
            const opts = this.data.textureOpts;

            const image = Assets.terrain[opts.id] || opts.path || opts.image;

            if (image) {
                if (textureCache[image] == null) {
                    textureCache[image] = {
                        url: image,
                        content: await Loader.loadSharedTexture(image),
                        used: 0,
                    };

                    textureCache[image].content.__url = image;
                }

                this.textureMap = textureCache[image].content;

                textureCache[image].used++;

                if (signal.aborted) return;

                this.textureMapRatio =
                    this.textureMap.source.data.width /
                    this.textureMap.source.data.height;

                this.textureMap.colorSpace = SRGBColorSpace;
                this.textureMap.minFilter = LinearMipmapLinearFilter;
                this.textureMap.magFilter = LinearFilter;
                this.textureMap.generateMipmaps = true;
                this.textureMap.wrapS = RepeatWrapping;
                this.textureMap.wrapT = RepeatWrapping;
                this.textureMap.needsUpdate = true;

                var ratio;

                if (this.data.scale.x < this.data.scale.z) {
                    ratio = this.data.scale.x / this.data.scale.z;

                    this.textureMap.repeat.set(1 * ratio, this.textureMapRatio);
                } else {
                    ratio = this.data.scale.z / this.data.scale.x;

                    this.textureMap.repeat.set(1, this.textureMapRatio * ratio);
                }

                this.textureMap.repeat.x *= this.data.tiles;

                this.textureMap.repeat.y *= this.data.tiles;

                this.mesh.diffuseMaterials.material.map =
                    this.mesh.lightingMaterials.material.map = this.textureMap;

                this.mesh.diffuseMaterials.material.needsUpdate =
                    this.mesh.lightingMaterials.material.needsUpdate = true;
            }

            const sideOpt = this.data.textureSideOpts;

            const image2 =
                Assets.terrain[sideOpt.id] || sideOpt.path || sideOpt.image;

            if (image2) {
                if (textureCache[image2] == null) {
                    textureCache[image2] = {
                        content: await Loader.loadSharedTexture(image2),
                        used: 0,
                    };
                }

                this.textureSideMap = textureCache[image2].content;

                textureCache[image2].used++;

                if (signal.aborted) return;

                this.textureSideMapRatio =
                    this.textureSideMap.source.data.width /
                    this.textureSideMap.source.data.height;

                this.textureSideMap.colorSpace = SRGBColorSpace;
                this.textureSideMap.minFilter = LinearMipmapLinearFilter;
                this.textureSideMap.magFilter = LinearFilter;
                this.textureSideMap.generateMipmaps = true;
                this.textureSideMap.wrapS = RepeatWrapping;
                this.textureSideMap.wrapT = RepeatWrapping;
                this.textureSideMap.needsUpdate = true;

                var ratio;

                if (this.data.scale.x < this.data.scale.z) {
                    ratio = this.data.scale.x / this.data.scale.z;

                    this.textureSideMap.repeat.set(
                        1 * ratio,
                        this.textureSideMapRatio
                    );
                } else {
                    ratio = this.data.scale.z / this.data.scale.x;

                    this.textureSideMap.repeat.set(
                        1,
                        this.textureSideMapRatio * ratio
                    );
                }

                this.textureSideMap.repeat.x *= this.data.tiles;

                this.textureSideMap.repeat.y *= this.data.tiles;

                this.mesh.diffuseMaterials.material.sideMap =
                    this.mesh.lightingMaterials.material.sideMap =
                        this.textureSideMap;

                this.mesh.diffuseMaterials.material.needsUpdate =
                    this.mesh.lightingMaterials.material.needsUpdate = true;
            }
        }

        if (this.mesh.diffuseMaterials.mirrorMaterial) {
            this.mesh.diffuseMaterials.mirrorMaterial =
                this.mesh.diffuseMaterials.material;

            this.mesh.lightingMaterials.mirrorMaterial =
                this.mesh.lightingMaterials.material;
        }

        this.mesh._onLighting(CURRENT_LIGHTING_STATE);

        // SET_LIGHTING_STATE( previousLightingState )
    }

    private async computeGeometry() {
        if (!this.data.noiseEnabled) {
            if (this.data.shape == "plane") {
                this.mesh.geometry = new PlaneGeometry(1, 1, 25, 25);
            } else if (this.data.shape == "circle") {
                this.mesh.geometry = new RingGeometry(0, 0.5, 25, 25);
            }

            this.mesh.geometry.rotateX(-Math.PI * 0.5);
        } else {
            if (this.#worker) {
                this.mesh.geometry =
                    (await this.computeNoiseGeometryInWorker()) as any;
            } else {
                this.mesh.geometry = generateTerrainGeometry(this.data);
            }

            this.mesh.rotation.x = 0;
        }

        // @ts-ignore
        this.mesh.geometry.needsUpdate = true;

        this.geometryNeedsUpdate = false;
    }

    private computeNoiseGeometryInWorker() {
        //

        return new Promise((resolve) => {
            this.geoAbort?.abort();

            this.geoAbort = new AbortController();

            const signal = this.geoAbort.signal;

            this.#worker.postMessage(this.data);

            this.#worker.onmessage = (e) => {
                if (signal.aborted) return;

                const geometry = new BufferGeometry();

                geometry.setAttribute(
                    "position",
                    new BufferAttribute(e.data.position, 3)
                );

                geometry.setAttribute(
                    "normal",
                    new BufferAttribute(e.data.normal, 3)
                );

                geometry.setAttribute("uv", new BufferAttribute(e.data.uv, 2));

                geometry.setIndex(new BufferAttribute(e.data.index, 1));

                this.#worker.onmessage = null;

                SET_SHADOW_NEEDS_UPDATE(true);

                resolve(geometry);
            };
        });
    }

    protected dispose() {
        this.#worker?.terminate();

        DisposePipelinesMeshes(this.mesh, true);

        this.mesh.dispose();

        this.mesh = null;

        if (textureCache[this.textureMap?.__url]) {
            const data = textureCache[this.textureMap.__url];
            data.used--;

            if (data.used <= 0) {
                this.textureMap.dispose();

                delete textureCache[this.textureMap.__url];
            }
        } else {
            if (this.textureMap) {
                this.textureMap.dispose();
            }
        }

        if (textureCache[this.textureSideMap?.__url]) {
            const data = textureCache[this.textureSideMap.__url];
            data.used--;

            if (data.used <= 0) {
                this.textureSideMap.dispose();

                delete textureCache[this.textureSideMap.__url];
            }
        } else {
            if (this.textureSideMap) {
                this.textureSideMap.dispose();
            }
        }

        // disposeThreeResources(this);
    }
}
