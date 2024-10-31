import { DefaultComponentFactory } from "engine/abstract/defaultcomponentfactory";
import { DestinationComponent } from "./destinationcomponent";

export class DestinationComponentFactory extends DefaultComponentFactory<DestinationComponent> {
    //
    Type = DestinationComponent;

    static info = {
        type: "destination",
        title: "Destination",
        image: "https://res.cloudinary.com/ugc-oo-oo/image/upload/v1722263109/290724-default-file-placeholder.png",
        singleton: true,
        hidden: true,
    };

    static {
        //[]
        const defaultData = {
            id: "destination",
            kit: "cyber",
            type: "destination",
        };

        this.createDataWrapper({
            defaultData,
        });
    }
}
