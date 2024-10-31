import { CANVAS, VIEW, DPI } from "engine/constants";

import Emitter from "engine/events/emitter";

import Events from "engine/events/events";

export default class Offscreen {
  constructor() {
    this.worker = new Worker(new URL("./index.worker.js", import.meta.url));

    this.isPlaying = false;
  }

  init() {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");

      const offscreenCanvas = canvas.transferControlToOffscreen();

      debugger;

      canvas.style.position = "absolute";
      canvas.style.top = "0";
      canvas.style.left = "0";
      canvas.style.width = "100%";
      canvas.style.height = "100%";

      this.worker.addEventListener("message", (res) => {
        const data = res.data;

        if (data.type == "init") {
          resolve();
        } else if (data.type == "error") {
          console.error("support offscreen canvas on intro starfield is wrong");

          this.worker = null;

          resolve();

          return;
        }
      });

      this.worker.postMessage(
        {
          type: "init",
          canvas: offscreenCanvas,
        },
        [offscreenCanvas]
      );

      this.workerCanvas = canvas;
    });
  }

  play() {
    if (this.isPlaying == true) {
      return;
    }

    this.isPlaying = true;

    this.addEvents();

    this.resize(VIEW.w, VIEW.h);

    this.worker.postMessage({
      type: "play",
    });

    this.worker.postMessage({ type: "activate" });

    CANVAS.parentNode.insertBefore(this.workerCanvas, CANVAS.nextSibling);
  }

  stop() {
    return new Promise((resolve, reject) => {
      if (this.isPlaying) {
        this.worker.addEventListener("message", (res) => {
          const data = res.data;

          if (data.type == "desactivate") {
            this.workerCanvas.style.display = "none";

            this.workerCanvas.parentNode.removeChild(this.workerCanvas);

            this.worker.terminate();

            this.workerCanvas = null;

            // appart from intro no need anymore

            this.worker = null;

            this.removeEvents();

            resolve(true);
          }
        });

        this.worker.postMessage({ type: "desactivate" });
      } else {
        resolve();
      }
    });
  }

  resize() {}

  addEvents() {
    if (this.resizeEvent == null) {
      this.resizeEvent = () => {
        this.resize(VIEW.w, VIEW.h);
      };

      Emitter.on(Events.RESIZE, this.resizeEvent);
    }
  }

  removeEvents() {
    if (this.resizeEvent != null) {
      Emitter.off(Events.RESIZE, this.resizeEvent);

      this.resizeEvent = null;
    }
  }

  resize(w, h) {
    this.worker.postMessage({
      type: "resize",
      size: {
        w: w,
        h: h,
        dpi: DPI,
      },
    });
  }
}
