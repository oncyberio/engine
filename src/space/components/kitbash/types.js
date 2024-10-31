// @ts-check

import InstancedPipelineMesh from "engine/abstract/instancedpipelinemesh";

import InstancedGeometry from "engine/abstract/instancedgeometry";

import DebugBoxFactory from "engine/components/debugbox";

import DiffuseMaterial from "./material/diffusematerial.js";

import LightMaterial from "./material/standardmaterial.js";

import { Box3, BufferGeometry, Sphere, Mesh, Material } from "three";

import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";

//let isEditing = UPLOADER_MODE || EDIT_MODE
let isEditing = false;

import { getPluginFromName } from "engine/libraries";

import { CAMERA_LAYERS } from "engine/constants";

import InstancedShadow from "engine/materials/instancedshadow/index.js";

import FadePlugin from "engine/libraries/visuals/fade/index.js";

export default function getTypes(res, data = {}) {
    //isEditing = UPLOADER_MODE || EDIT_MODE

    var plugins = [];

    // get plugins from data

    if (data.plugins != null) {
        for (let i = 0; i < data.plugins.length; i++) {
            const plugin = getPluginFromName(data.plugins[i]);

            if (plugin != null) {
                plugins.push(new plugin());
            }
        }
    }

    //plugins.push( new FadePlugin() )

    const types = {};

    let blocks = res.children;

    let i = 0;

    let currentBlock = res.getObjectByName(data.kitType);

    if (currentBlock == null) {
        return;
    }

    const blockChilds = currentBlock.children;

    const items = [];

    let previewImg;

    let count = 1;

    let containsCollision = null;

    let g = 0;

    var needsCollision = true;

    while (g < blockChilds.length) {
        if (blockChilds[g].name.includes("collision")) {
            containsCollision = blockChilds[g];
        }

        if (blockChilds[g].name.includes("nocollider") == true) {
            needsCollision = false;
        }

        g++;
    }

    // if (isEditing == false) {
    //     let c = 0;

    //     for (let key in data) {
    //         const item = data[key];
    //         console.log("getTypes", data, item);
    //         if (data[key] == null) {
    //             debugger;
    //         }
    //         if (data[key].type == currentBlock.name) {
    //             count++;
    //         }

    //         c++;
    //     }
    // }

    const box = new Box3();

    box.expandByObject(currentBlock);

    var collisionMesh;

    var raycastGeometry;

    // console.log( "containsCollision" )
    // console.log( containsCollision )

    if (containsCollision) {
        collisionMesh = new Mesh(containsCollision.geometry.clone());
    } else {
        let geometries = [];

        currentBlock.traverse((child) => {
            if (child instanceof Mesh) {
                // Clone the child's geometry
                let geometry = child.geometry.clone();

                // Apply the child's matrix (including position, rotation, scale)
                geometry.applyMatrix4(child.matrixWorld);

                geometries.push(geometry);
                // Merge with the accumulated geometry
            }
        });

        let mergedGeometry = BufferGeometryUtils.mergeGeometries(
            geometries,
            false
        );

        collisionMesh = new Mesh(mergedGeometry);

        //DebugBoxFactory.getMeshFromObjects(currentBlock);
    }

    raycastGeometry = collisionMesh.geometry.clone();

    desinterleave(raycastGeometry);

    const blockSphere = computeBoundingSphere(currentBlock);

    // if blocks got childrens
    // make them all the same instance

    if (blockChilds.length > 0) {
        // above 2

        if (blockChilds.length > 1) {
            var copyBuffer = null;

            blockChilds.forEach((block) => {
                // if there's no collision

                if (block.name.includes("collision") == false) {
                    const item = constructItems(block, {
                        boundingSphere: blockSphere,

                        copyBuffer: copyBuffer,

                        transparencySorting:
                            block.material.transparent &&
                            block.material.opacity < 1,

                        count: count,

                        plugins: plugins,

                        data: data,
                    });

                    items.push(item);

                    // first object is the copy buffer

                    if (copyBuffer == null) {
                        copyBuffer = item.mesh.geometry;
                    }
                }
            });
        } else {
            blockChilds.forEach((block) => {
                items.push(
                    constructItems(block, {
                        boundingSphere: blockSphere,

                        count: count,

                        transparencySorting:
                            block.material.transparent &&
                            block.material.opacity < 1,
                        plugins: plugins,

                        data: data,
                    })
                );
            });
        }
    } else if (currentBlock.geometry && currentBlock.material) {
        const block = currentBlock;

        items.push(constructItems(block, { plugins: plugins, data: data }));
    }

    if (items.length != 0) {
        return {
            // @ts-ignore
            baseItems: items,

            collision: needsCollision ? collisionMesh : null,

            raycastGeometry: raycastGeometry,

            baseBox: box,

            // TODO: preview image
            previewImg,
        };
    }

    // no results return null

    return null;
}

function constructItems(block, opts = {}) {
    desinterleave(block.geometry);

    if (opts.containsCollision) {
        desinterleave(opts.containsCollision.geometry);
    }

    var collisionMesh = opts.containsCollision
        ? new Mesh(opts.containsCollision.geometry.clone())
        : DebugBoxFactory.getMesh(block.geometry);

    var lightMaterial;

    var diffuseMaterial;

    const customMaterials = opts.data.customMaterials;

    lightMaterial =
        customMaterials?.lightingMaterial != null
            ? new customMaterials.lightingMaterial(block, opts)
            : new LightMaterial(block, opts);
    diffuseMaterial =
        customMaterials?.diffuseMaterial != null
            ? new customMaterials.diffuseMaterial(block, opts)
            : new DiffuseMaterial(block, opts);

    const item = {
        name: block.name,

        plugins: opts.plugins,

        mesh: new InstancedPipelineMesh(
            new InstancedGeometry(block.geometry, {
                plugins: opts.plugins,

                max: opts.count,

                rotation: true,

                scale: true,

                copyBuffer: opts.copyBuffer,

                boundingSphere: opts.boundingSphere,

                transparencySorting: opts.transparencySorting,

                useNormal: true,

                name: block.name + "_geometry",
                // passing a max count for buffer when not upload mode
            }),

            diffuseMaterial,

            {
                lightingMaterial: lightMaterial,

                type: block.name,
            }
        ),
    };

    item.mesh.castShadow = true;

    item.mesh.receiveShadow = true;

    item.mesh.customDepthMaterial = customMaterials?.customDepthMaterial
        ? new customMaterials.customDepthMaterial()
        : new InstancedShadow();

    item.mesh.customDepthMaterial.name = block.name + "_geometry" + "shadow";

    item.mesh.matrixAutoUpdate = false;

    item.mesh.matrixWorldAutoUpdate = false;

    if (opts.data.shadow != null) {
        if (opts.data.shadow == "dynamic") {
            item.mesh.layers.set(CAMERA_LAYERS.DYNAMIC);
        }
    }

    return item;
}

function desinterleave(geometry) {
    if (geometry.attributes.color) {
        geometry.deleteAttribute("color");
    }

    if (geometry.attributes.position.isInterleavedBufferAttribute) {
        geometry.attributes.position = geometry.attributes.position.clone();
    }

    if (geometry.attributes?.uv?.isInterleavedBufferAttribute) {
        geometry.attributes.uv = geometry.attributes.uv.clone();
    }

    if (geometry.attributes?.normal?.isInterleavedBufferAttribute) {
        geometry.attributes.normal = geometry.attributes.normal.clone();
    }
}

function computeBoundingSphere(object) {
    const sphere = new Sphere();

    object.traverse((child) => {
        if (child.geometry) {
            child.geometry.computeBoundingSphere();

            sphere.union(child.geometry.boundingSphere);
        }
    });

    return sphere;
}
