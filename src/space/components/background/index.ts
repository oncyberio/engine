import { BackgroundComponent } from "./backgroundcomponent";
import { presetImages } from "./data";
import { DefaultComponentFactory } from "engine/abstract/defaultcomponentfactory";

export class BackgroundComponentFactory extends DefaultComponentFactory<BackgroundComponent> {
    //
    Type = BackgroundComponent;

    static info = {
        type: "background",
        title: "Sky",
        image: "https://res.cloudinary.com/ugc-oo-oo/image/upload/v1722260925/290724-sky.jpg",
        help: {
            desc: "Set the Background as one of our presets or upload your own.",
        },
        required: true,
        singleton: true,
        priority: 4,
    };

    static {
        //
        const defaultData = {
            id: "background",
            kit: "cyber",
            type: "Images",
            // Color or Texture
            backgroundType: "Color",
            colorOpts: {
                color: "#000000",
            },
            textureOpts: {
                // Sky or Image
                textureType: "Image",
                skyOpts: {
                    turbidity: 10,
                    rayleigh: 3,
                    mieCoefficient: 0.005,
                    mieDirectionalG: 0.7,
                    azimuth: 180,
                    elevation: 2,
                },
                imageOpts: {
                    image: presetImages.day2,
                },
            },
        };

        this.createDataWrapper({
            defaultData,
        });
    }
}
