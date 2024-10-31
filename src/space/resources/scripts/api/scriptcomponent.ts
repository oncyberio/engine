import type { Intersection, Mesh } from "three";
import type { ComponentOptions } from "./scriptparams";
import type {
    CollisionEnterEvent,
    CollisionExitEvent,
    SensorEvent,
} from "engine/components/physics/rapier/constants";
import { ScriptHost } from "../scriptfactory/scripthost";
import { Component3D, DataChangeOpts } from "engine/abstract/component3D";

type Constructor<T> = new (...args: any[]) => T;

type IfEquals<X, Y, A = X, B = never> = (<T>() => T extends X ? 1 : 2) extends <
    T,
>() => T extends Y ? 1 : 2
    ? A
    : B;

type DataPropNames<T> = {
    [K in keyof T]: T[K] extends Function
        ? never
        : K extends `_${string}`
        ? never
        : K extends "host"
        ? never
        : IfEquals<{ [P in K]: T[K] }, { -readonly [P in K]: T[K] }, K, never>;
}[keyof T];

type DataProps<T> = {
    [P in DataPropNames<T>]?: T[P];
} & {
    parentId?: string;
};

/**
 * @public
 */
export class ScriptComponent extends ScriptHost {
    declare material: never;
    declare geometry: never;

    //
    static readonly config: ComponentOptions;

    /**
     * Creates a new instance of the script component
     */
    static async create<T extends ScriptComponent>(
        this: Constructor<T>,
        data?: DataProps<T>
    ): Promise<T> {
        //
        const module = (this as any).$$module;

        if (!module) {
            throw new Error(
                "Can't find the module for this script component. Did you forget to add the @Component decorator?"
            );
        }

        const host: ScriptHost =
            await module._resourceFactory.space.components.create({
                ...data,
                type: module.data.id,
            });

        host.instance.onReady();

        // @ts-ignore
        return host.instance;
    }

    /**
     * @deprecated
     */
    static get instances() {
        //
        return this.getInstances();
    }

    static getInstances<T extends ScriptComponent>(this: Constructor<T>): T[] {
        //
        const module = (this as any).$$module;

        if (!module) {
            throw new Error(
                "Can't find the module for this script component. Did you forget to add the @Component decorator?"
            );
        }

        return module._resourceFactory.space.components
            .byType(module.data.id)
            .map((host) => host.instance ?? host);
    }

    static getMain<T extends ScriptComponent>(this: Constructor<T>): T {
        //
        const module = (this as any).$$module;

        if (!module) {
            throw new Error(
                "Can't find the module for this script component. Did you forget to add the @Component decorator?"
            );
        }

        const host = module._resourceFactory.space.components.byType(
            module.data.id
        )?.[0];
        return host?.instance ?? host;
    }

    /**
     * Invoked when the host component is initialized
     */
    onRenderInit() {}

    /**
     * Invoked when the host component is updated
     */
    onRenderUpdate(opts: DataChangeOpts) {}

    /**
     * Invoked when the host component is asked for its collision mesh (if any)
     */
    onGetCollisionMesh(): Mesh {
        //
        return null;
    }

    /**
     * Invoked when the host component is asked for its collision mesh (if any)
     */
    onRenderDispose() {}

    onPreload() {}

    onLoad() {}

    /**
     * Invoked only **one time** when all assets are loaded and the game is ready to start.
     */
    onReady() {}

    /**
     * Invoked whenever the game is started or restarted by the user.
     */
    onStart() {}

    /**
     * Invoked whenever the game has ended.
     */
    onEnd() {}

    /**
     * Invoked when all children of the host component are loaded
     */

    onChildrenLoaded(children: Component3D[]) {}

    /**
     * Invoked when the component is attached to a parent
     */
    onAttached() {}

    /**
     * Invoked each frame even if the game isnt running
     */
    onFrame(dt: number) {}

    /**
     * Invoked each frame when the game is running.
     *
     * @param dt The time in seconds since the last frame
     */
    onUpdate(dt: number) {}

    // onDawnUpdate() {}

    /**
     * Invoked at regular intervals when the game is running.
     * Use this when writing custom controls, or other physics sensitive calculations.
     *
     * @param dt
     */
    onFixedUpdate(dt: number) {}

    /**
     * Invoked when the game is paused by the user.
     */
    onPause() {}

    /**
     * Invoked when the game is resumed by the user.
     */
    onResume() {}

    /**
     * Invoked when the game is about to be destroyed.
     * Use this for final cleanup, like releasing resources or unsubscribing from events
     */
    onDispose() {}

    /**
     * Returns the meshes that can be selected in the editor
     */
    onEditorGetMeshes(): Array<Mesh> | null {
        //
        return null;
    }

    onGetGui() {}

    //
    /**
     * Invoked when the user clicks on a mesh in the editor
     */
    onEditorMeshClicked(mesh: Mesh, intersect: Intersection<Mesh>) {}

    /**
     * Invoked when the user hovers over a mesh in the editor
     */
    onEditorMeshMouseEnter(mesh: Mesh, intersect: Intersection<Mesh>) {}

    /**
     * Invoked when the user hovers out of a mesh in the editor
     */
    onEditorMeshMouseLeave(mesh: Mesh) {}

    /**
     * Handles the sensor enter event for the host component
     */
    handleSensorEnter(event: SensorEvent) {}

    /**
     * Handles the sensor exit event for the host component
     */
    handleSensorExit(event: SensorEvent) {}

    /**
     * Handles the sensor stay event for the host component
     */
    handleSensorStay(event: SensorEvent) {}

    /**
     * Handles the collision enter event for the host component
     */
    handleCollisionEnter(event: CollisionEnterEvent) {}

    /**
     * Handles the collision exit event for the host component
     */
    handleCollisionExit(event: CollisionExitEvent) {}

    /**
     * Handles the collision stay event for the host component
     */
    handleCollisionStay(event: CollisionEnterEvent) {}
}
