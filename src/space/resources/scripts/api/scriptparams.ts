//

import type { TransformConfigOpts } from "engine/abstract/componentinfo";

export interface BehaviorOptions {
    title?: string;
    description?: string;
    tip?: string;
    image?: string;
    imageXL?: string;
    server?: boolean;
    // layout?: Record<string, { label?: string; children: string[] }>;
}

export interface ComponentOptions extends BehaviorOptions {
    singleton?: boolean;
    draggable?: boolean;
    transform?: TransformConfigOpts;
    batchDraw?: boolean;
}

/**
 * @internal
 */
export interface InternalConfig extends ComponentOptions {
    scriptType?: "component" | "behavior";
}

/**
 * @public
 * @deprecated use ScriptComponent instead https://docs.oncyber.io/components
 *
 * Defines a script as a component that can be added to the world space via the studio
 * You can annotate the script class properties using `@Param` to make them editable in the studio
 */
export function Component(options: ComponentOptions): ClassDecorator {
    // This is the actual decorator function
    return function (constructor: Function) {
        //
        constructor.prototype["$$config"] ??= {};

        const config = constructor.prototype["$$config"];

        config.scriptType = "component";

        Object.assign(config, options);
    };
}

/**
 * @public
 * @deprecated use ScriptBehavior instead https://docs.oncyber.io/behaviors
 *
 * Defines a script as a behavior that can be attached to components in the world to add functionality
 * You can use Behaviors to add a variety of functionality to components like adding
 * Examples include:
 *
 *  - Animating a component
 *  - Make the component follow the player
 *  - Attack the player when they get close
 *
 * You can annotate the script class properties using `@Param` to make them editable in the studio
 */
export function Behavior(options: BehaviorOptions): ClassDecorator {
    // This is the actual decorator function
    return function (constructor: Function) {
        //
        constructor.prototype["$$config"] ??= {};

        const config = constructor.prototype["$$config"];

        config.scriptType = "behavior";

        Object.assign(config, options);
    };
}

export const Config = Component;

export { ScriptComponent } from "./scriptcomponent";

export { ScriptBehavior } from "./scriptbehavior";

export * from "engine/space/params/decorators";
