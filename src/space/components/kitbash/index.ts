import KitBuilder from "./kitbuilder";

import { Group } from "three";

import getTypes from "./types";

import { KitBashComponent } from "./kitbashcomponent";

import { COMPRESSED_SUPPORT, IS_DESKTOP } from "engine/constants";

const debug = false;

import { DisposePipelinesMeshes } from "engine/utils/dispose.js";
import { DefaultComponentFactory } from "engine/abstract/defaultcomponentfactory";

export class KitbashComponentFactory extends DefaultComponentFactory<KitBashComponent> {
    //
    static info = {
        type: "kitbash",
        title: "Kit Element",
        image: "",
        draggable: true,
    } as const;

    static getTitle(data: any) {
        return data.kitType;
    }

    types: Record<string, any> = {};

    instancesGroup: Group = new Group();

    kit: string = null;

    gltfKit: any = null;

    ready: Promise<any>;

    static {
        //
        const defaultData = {
            id: "",
            name: "",
            type: "kitbash",
            kitType: "",
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
        };

        this.createDataWrapper({
            defaultData,
        });
    }

    async init(opts) {
        //
        this.kit = Object.keys(opts.kits)[0];

        if (this.kit == null) return;

        const links = opts.kits[this.kit];

        var url = links.high;

        if (COMPRESSED_SUPPORT) {
            if (COMPRESSED_SUPPORT && links?.low_compressed != null) {
                url = links.low_compressed;
            }
        } else if (IS_DESKTOP == false && links?.low != null) {
            url = links.optimized?.low;
        }

        this.types = {};

        this.gltfKit = (await KitBuilder.load(url)).scene;
    }

    async createInstance(data) {
        //
        if (this.kit == null) return;

        var pluginsString = "";

        if (data.plugins != null) {
            pluginsString = data.plugins.toString();
        }

        var identifier = data.kitType + pluginsString;

        if (this.types[identifier] == null) {
            this.types[identifier] = getTypes(this.gltfKit, data);
        }

        const kitbashType = this.types[identifier];

        if (kitbashType == null) {
            throw new Error("type does not exists : " + identifier);
        }

        let kitbashElement = new KitBashComponent({
            ...this.opts,
            info: this.info,
            data,
            kitbashType,
        });

        await kitbashElement.init();

        return kitbashElement;
    }

    dispose() {
        //
        if (this.kit == null) return;

        // this.types[ opts.currentType ]

        for (const key in this.types) {
            //
            const currentType = this.types[key];

            currentType.accessors = [];

            currentType.baseItems.forEach((item) => {
                item.mesh.reset();

                DisposePipelinesMeshes(item.mesh);

                item.mesh.dispose();

                item.mesh = null;
            });
        }
    }

    getPluginString(opts) {
        var str = "";

        if (opts.plugins != null) {
            let i = 0;

            while (i < opts.plugins.length) {
                str += opts.plugins[i].name + ",";
                i++;
            }
        }

        return str;
    }
}
