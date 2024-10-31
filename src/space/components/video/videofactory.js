// @ts-check

import { DefaultComponentFactory } from "engine/abstract/defaultcomponentfactory";

import { VideoFactory } from "engine/components/media/video";

export class VideoComponentFactory extends DefaultComponentFactory {
    async init(opts) {
        this.videoFactory = new VideoFactory();

        return super.init(opts);
    }

    dispose() {
        super.dispose();

        this.videoFactory.disposeAll();

        this.videoFactory = null;
    }
}
