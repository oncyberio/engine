import { DefaultComponentFactory } from "engine/abstract/defaultcomponentfactory";
import { MultiplayerComponent } from "./multiplayercomponent";
import { max } from "three/examples/jsm/nodes/Nodes.js";

export class MultiplayerComponentFactory extends DefaultComponentFactory<MultiplayerComponent> {
    //
    Type = MultiplayerComponent;

    static info = {
        type: "multiplayer",
        title: "Multiplayer",
        image: "https://res.cloudinary.com/ugc-oo-oo/image/upload/v1728927317/1728927316-uploaded-assets/0748fc2398dce7991c641d61c002df0545ad09ba553284850c24301435fafc69.png.png",
        singleton: true,
        description:
            "This component is used to enable & configure multiplayer in the space.",
        priority: 11,
    };

    static {
        //
        const defaultData = {
            id: "multiplayer",
            kit: "cyber",
            type: "multiplayer",
            enable: true,
            autoStart: true,
            url: "",
            maxPlayers: 500,
            patchRate: 20,
            serverEngine: false,
            authoritativePosition: false,
            reconnectTimeout: 0,
            secrets: [],
        };

        this.createDataWrapper({
            defaultData,
            valuePaths: ["secrets"],
        });
    }
}
