import { SRGBColorSpace, VideoTexture } from "three";

import Textures from "engine/textures";

import Wrapper from "./wrapper.js";

import { Assets } from "engine/assets";

export class VideoFactory {
  constructor() {
    this.instances = {};

    // globalThis.VideoFactory = this;
  }

  async get(parent, data) {
    if (Textures.isLock(data.preview) == true) {
      await Textures.loadOnce({ name: data.preview, url: data.preview });
    }

    if (this.instances[data.url + data.preview] == null) {
      var preview = data.preview;

      // check if preview isnt null and if the preview extension includes .mp4
      if (preview == null || preview.endsWith(".mp4")) {
        preview = Assets.textures.impact;
      }

      const previewTexture = await Textures.loadOnce({
        name: preview,
        url: preview,
      });

      previewTexture.colorSpace = SRGBColorSpace;

      previewTexture.ratio =
        previewTexture.source.data.width / previewTexture.source.data.height;

      Textures.unlock(preview);

      this.instances[data.url + data.preview] = {
        previewTexture: previewTexture,
        content: [],
      };
    }

    let video, videoTexture;

    if (data.url) {
      //
      video = await this.getVideo(data.url);

      videoTexture = new VideoTexture(video);

      videoTexture.colorSpace = SRGBColorSpace;

      videoTexture.generateMipmaps = false;
    }

    var wrapper = new Wrapper(
      this.instances[data.url + data.preview],
      { video: video, videoTexture: videoTexture },
      data
    );

    this.instances[data.url + data.preview].content.push(wrapper);

    parent.add(wrapper);

    return wrapper;
  }

  dispose(instance) {
    //
  }

  disposeAll() {
    for (let url in this.instances) {
      let i = 0;

      while (i < this.instances[url].content.length) {
        if (this.instances[url].content[i].parent) {
          this.instances[url].content[i].parent.remove(
            this.instances[url].content[i]
          );
        }

        this.instances[url].content[i].dispose();

        this.instances[url].content[i] = null;

        Textures.remove(url);

        i++;
      }
    }

    this.instances = {};
  }

  async getVideo(url) {
    //
    var video = document.createElement("video");

    video.crossOrigin = "anonymous";
    video.playsInline = true;
    video.muted = true;
    video.loop = true;

    video.src = url;

    var ps = new Promise((resolve, reject) => {
      video.onloadeddata = (event) => {
        resolve();
      };

      // video.onloadedmetadata = (event) => {
      //     //
      //     console.log("onloadedmetadata", event);
      // };

      video.onerror = (event) => {
        console.error("video.onerror", event);

        reject();
      };
    });

    video.load();

    await ps;

    return video;
  }
}
