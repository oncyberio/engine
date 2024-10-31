import { DefaultComponentFactory } from "engine/abstract/defaultcomponentfactory";
import { PortalComponent } from "./portalcomponent";
import { PortalFactory } from "engine/components/portal";

export class PortalComponentFactory extends DefaultComponentFactory<PortalComponent> {
    Type = PortalComponent;

    static info = {
        type: "portal",
        title: "Portal",
        image: "/components/model.png",
    };

    static {
        // debugger;

        const defaultData = {
            kit: "cyber",
            type: "portal",
            name: "",
            billboard: true,
            position: {
                x: 0,
                y: 0,
                z: 0,
            },
            rotation: {
                x: 0,
                y: 0,
                z: 0,
            },

            scale: {
                x: 1,
                y: 1,
                z: 1,
            },
        };

        this.createDataWrapper({
            defaultData,
        });
    }

    private portalFactory: PortalFactory = null;

    async init(opts) {
        this.portalFactory = new PortalFactory();

        return super.init(opts);
    }

    async createInstance(data) {
        //
        if (this.Type == null) {
            throw new Error(
                "Type not set for default component factory " + this.info.type
            );
        }

        const instance = new PortalComponent({
            space: this.space,
            container: this.container,
            info: this.info,
            data,
            portalFactory: this.portalFactory,
        });

        await instance.onInit();

        return instance;
    }

    dispose() {
        //
        super.dispose();

        this.portalFactory.disposeAll();

        this.portalFactory = null;
    }
}
