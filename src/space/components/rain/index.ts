import { DefaultComponentFactory } from "engine/abstract/defaultcomponentfactory";
import { RainComponent } from "./raincomponent";

export class RainComponentFactory extends DefaultComponentFactory<RainComponent> {
    //
    Type = RainComponent;

    static info = {
        type: "rain",
        title: "Rain",
        image: "https://res.cloudinary.com/ugc-oo-oo/image/upload/v1722271320/290724-rain.jpg",
        singleton: true,
        disableLock: true,
    };

    static {
        //
        const defaultData = {
            id: "rain",
            kit: "cyber",
            type: "rain",
            intensity: 0.5,
        };

        this.createDataWrapper({
            defaultData,
        });
    }
}
