import { DefaultComponentFactory } from "engine/abstract/defaultcomponentfactory";
import { ImageFactory } from "engine/components/media/image";
import { ImageComponent } from "./imagecomponent";

export class ImageComponentFactory extends DefaultComponentFactory<ImageComponent> {
    //
    Type = ImageComponent;

    static info = {
        type: "image",
        title: "Image",
        image: "https://res.cloudinary.com/ugc-oo-oo/image/upload/v1702575086/oo-ugc/imageIcon_qc8a90.png",
        draggable: true,
        transform: true,
        prefab: true,
    };

    static {
        // debugger;

        const defaultData = {
            id: "",
            kit: "cyber",
            type: "image",
            name: "",
            url: "",
            mime_type: "",
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            borderColor: null,
            hd: false,
            useMipMap: true,
            minFilter: "LinearMipmapLinearFilter",
            magFilter: "LinearFilter",
            opacity: 1,
            meta: {
                addedBy: "",
                placeholder: "",
            },
        };


        this.createDataWrapper({
            defaultData,
        });
    }

    private imageFactory: ImageFactory = null;

    async init(opts) {
        //
        this.imageFactory = new ImageFactory();

        return super.init(opts);
    }

    async createInstance(data) {
        //
        if (this.Type == null) {
            throw new Error(
                "Type not set for default component factory " + this.info.type
            );
        }

        const instance = new ImageComponent({
            space: this.space,
            container: this.container,
            info: this.info,
            data,
            imageFactory: this.imageFactory,
        });

        await instance.onInit();

        return instance;
    }

    dispose() {
        //
        super.dispose();

        this.imageFactory.disposeAll();

        this.imageFactory = null;
    }
}
