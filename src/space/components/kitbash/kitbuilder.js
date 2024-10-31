// @ts-check

import { Color, MeshBasicMaterial } from "three";

// import GetTypes from "./types.js";

import Loader from "engine/loader";

//import PreviewBaker from '@3utils/previewbaker.js'


import PipelineMesh from "engine/abstract/pipelinemesh";

class KitBuilder {
    constructor() {}

    setMaterial(blocks) {
        let i = 0;

        while (i < blocks.length) {
            const childrens = blocks[i].children.slice();

            const newchilds = [];

            childrens.forEach((block) => {
                const parent = block.parent;

                if (block.material) {
                    const mesh = new PipelineMesh(
                        block.geometry,

                        new MeshBasicMaterial(),
                    );

                    mesh.name = block.name;

                    parent.remove(block);

                    parent.add(mesh);
                }
            });

            i++;
        }
    }

    /**
     *
     * @param {string} url
     * @returns
     */
    async load(url) {

        const res = await Loader.loadGLTF(url);
      
        return res
    }

    // async bakeAssets( res ){

    // 	// const decoration = res.getObjectByName('decoration')

    // 	this.setMaterial( res.originalGLB.children  )

    // 	var previewBaker = new PreviewBaker()

    // 	var imgs = await previewBaker.renderKitImages( res.originalGLB.children, { postprocessing: true } )

    // 	previewBaker.dispose()

    // 	previewBaker = null

    // 	let result = {}

    // 	Object.values(imgs).forEach( it => {

    // 		result[it.name] = it.image
    // 	})

    // 	return result
    // }
}

export default new KitBuilder();
