// @ts-check
import { Space } from "./wrapper";

import { ComponentManager } from "./components/index";

import { Physics } from "../components/physics/index";

import { DEBUG_PHYSICS } from "engine/constants";

import { ResourceManager } from "./resources/resourcemanager";

import { ComponentsRegistry } from "./registry/index";

import type PhysicsRapierWrapper from "engine/components/physics/rapier/wrapper";

import { AppStateOpts } from "engine/index.js";

class SpaceFactory {
    //
    current: Space;

    physics: PhysicsRapierWrapper;

    async get(opts: AppStateOpts["GAME"]) {
        //
        if (this.current) {
            //
            throw new Error("Space already exists (dispose it first)");
        }

        const { resourceData, componentData } = this.buildTree(
            opts.game.components
        );

        let kits: Record<string, any> = {};

        for (let k in opts.game.kits) {
            //
            const kit = opts.game.kits[k];

            kits[k] = kit.paths;
        }

        // TO DO
        // Load recursively inside the actual config into the components, instead of calling the factory directly
        // This is part of the component refactoring

        const space = new Space(opts);
        space.name = "SPACE";
        this.current = space;

        // dispose previous space physics

        space.registry = new ComponentsRegistry({ space });

        const physics = Physics.get({
            type: "rapier",
            debug: DEBUG_PHYSICS,
        });

        await physics.init();

        space.physics = physics;

        // load resources
        space.resources = new ResourceManager({
            kits,
            space,
            externalApi: opts.externalApi,
            data: resourceData,
        });

        space.components = new ComponentManager({
            ...opts,
            data: componentData,
            space,
            kits,
            disableScripts: opts.disableScripts,
            loadOpts: opts.loadOpts,
        });

        await space.resources._loadAll();

        if (!opts.disableScripts && space.resources.scriptFactory != null) {
            const mainScript = space.resources.scriptFactory.getMainModule();

            const mainScriptAdded =
                mainScript != null && componentData[mainScript.data.id] != null;

            if (mainScript && !mainScriptAdded) {
                //
                componentData[mainScript.data.id] = {
                    id: "main",
                    type: mainScript.data.id,
                    name: "main",
                    // uri: mainScript.uri,
                };
            }
        }

        await space.components._build();

        // init physics
        return space;
    }

    disposables = [];

    dispose(space: Space) {
        //
        for (let disposable of this.disposables) {
            disposable.dispose();
        }

        this.disposables = [];

        //
        space?.components?.dispose();

        space?.resources?.dispose();

        Physics.dispose();

        space?.physics?.dispose();

        space?.registry?.dispose();

        space?.dispose();

        this.current = null;
    }

    isResource(data: any) {
        //
        return data.type === "script" || data.type === "prefab";
    }

    buildTree(components: Record<string, any>) {
        //
        const allResources: Record<string, any> = {};
        const allComponents: Record<string, any> = {};

        Object.values(components)
            .filter((comp) => comp?.id && comp?.type)
            .sort((a, b) => a.id.localeCompare(b.id))
            .forEach((comp) => {
                //
                if (this.isResource(comp)) {
                    //
                    allResources[comp.id] = comp;
                    //
                } else {
                    //
                    allComponents[comp.id] = comp;
                }
            });

        const resourceData = this._buildTree(allResources);

        const componentData = this._buildTree(allComponents);

        return { resourceData, componentData };
    }

    private _buildTree(data: Record<string, any>) {
        //
        const roots = {};

        Object.values(data).forEach((res) => {
            //

            //
            if (!res.parentId) {
                //
                roots[res.id] = res;
                //
            } else {
                //
                const parent = data[res.parentId];

                if (parent == null) {
                    //
                    console.error(`Invalid parent id: ${res.parentId}`);

                    return;
                }

                parent.children ??= {};

                parent.children[res.id] = res;
            }
        });

        return roots;
    }
}

export default new SpaceFactory();
