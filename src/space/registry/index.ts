import Augmented from "engine/abstract/augmented";
import Emitter from "engine/events/emitter";
import Events from "engine/events/events";

import type {
    ComponentFactory,
    ComponentFactoryOptions,
} from "engine/abstract/componentfactory";
import { components } from "../components/components";
import { Space } from "../wrapper";

export type FactoryClass = typeof ComponentFactory<any>;

const bultinComponents: Record<string, FactoryClass> = {};

components.forEach((Type) => {
    const info = Type.info;

    bultinComponents[info.type] = Type;
});

const reserved = {
    main: true,
};

export class ComponentsRegistry extends Augmented {
    //
    static bultinComponents = bultinComponents;

    space: Space;

    private _factoryClasses: Record<string, FactoryClass> = {
        ...bultinComponents,
    };

    private factoryPromises: Record<string, Promise<ComponentFactory<any>>> =
        {};

    componentTypes: Record<string, ComponentFactory<any>> = {};

    constructor(private opts: { space: Space }) {
        super();

        this.space = opts.space;

        Emitter.emit(Events.COMPONENT_FACTORY_INIt, {
            factoryClasses: this._factoryClasses,
        });
    }

    get factoryClasses() {
        return this._factoryClasses;
    }

    getFactoryClass(type) {
        return this._factoryClasses[type];
    }

    addFactory(type: string, factoryClass: FactoryClass) {
        //
        if (this._factoryClasses[type]) {
            throw new Error(`Factory for type ${type} already registered`);
        }

        if (reserved[type]) {
            throw new Error(`Type ${type} is reserved`);
        }

        this._factoryClasses[type] = factoryClass;

        Emitter.emit(Events.COMPONENT_FACTORY_ADDED, { type, factoryClass });
    }

    deleteFactory(type: string) {
        //
        const factoryClass = this._factoryClasses[type];

        if (factoryClass == null) {
            throw new Error("Factory for type " + type + " does not exists");
        }

        delete this._factoryClasses[type];

        const instances = this.opts.space.components.byType(type);

        if (instances.length > 0) {
            throw new Error("Can't delete factory " + type + " with instances");
        }

        delete this.componentTypes[type];

        delete this.factoryPromises[type];

        Emitter.emit(Events.COMPONENT_FACTORY_REMOVED, { type, factoryClass });
    }

    getExistingFactory(type: string) {
        //
        return this.componentTypes[type];
    }

    getFactory(type: string) {
        //
        return this.factoryPromises[type];
    }

    async getOrCreateFactory(type, opts: ComponentFactoryOptions) {
        //

        if (this.factoryClasses[type] == null) {
            return null;
            //throw new Error("type does not exists : " + type)
        }

        if (this.factoryPromises[type] == null) {
            this.factoryPromises[type] = this.getFactoryType(type, opts);
        }

        return this.factoryPromises[type];
    }

    private async getFactoryType(type: string, opts: ComponentFactoryOptions) {
        //
        if (this.componentTypes[type] != null) return this.componentTypes[type];

        const klass = this.factoryClasses[type];

        const fact = new klass();

        this.componentTypes[type] = fact;

        await fact.onInit(opts);

        return fact;
    }

    private _wasDisposed = false;

    dispose() {
        //
        if (this._wasDisposed) return;

        this._wasDisposed = true;

        for (let key in this.componentTypes) {
            this.componentTypes[key].onDispose();
        }

        this.componentTypes = {};

        this.factoryPromises = {};

        this._factoryClasses = {};
    }
}
