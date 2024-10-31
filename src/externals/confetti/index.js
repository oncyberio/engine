import { Scene, WebGLRenderer, OrthographicCamera } from "three";

import Mesh from "./mesh.js";

const frustumSize = 20;

const limit = 4.0;

import hexRgb from "engine/utils/hexrgb";

import Mix from "engine/utils/math/mix";
import mediator from "engine/events/mediator.js";

const defaultColors = ["#A964FD", "#2ACDFF", "#78FF43", "#FF708D", "#FDFF6A"];

// usage ::

// let defaultOpts = {x: 0.5, y: 0.5, zIndex: '100000',

//     colors: [

//       '#A964FD',
//       '#2ACDFF',
//       '#78FF43',
//       '#FF708D',
//       '#FDFF6A',
//     ]
// }

// var options = {...opts, ...defaultOpts}
// // you can add colors to opts
// //     // colors : [
// //     //     "#ff0000",
// //     //     "#00ff00",
// //     //     "#0000ff"
// //     // ]
// // })

// let confetti = new Confetti(options)

// confetti.play(options).then(()=>{

//     confetti.destroy()

//     confetti = null
// })

// // styling you want

// confetti.canvas.style.position ='absolute'
// confetti.canvas.style.zIndex = options.zIndex
// confetti.canvas.style.top ='0'
// confetti.canvas.style.left ='0'

export default class Confetti {
  constructor(opts = {}) {
    this.canvas = document.createElement("canvas");

    this.canvas.style.position = "absolute";
    this.canvas.style.zIndex = opts.zIndex ? opts.zIndex : "100000";
    this.canvas.style.top = "0";
    this.canvas.style.left = "0";
    this.canvas.style.pointerEvents = "none";

    document.body.appendChild(this.canvas);

    this.isAnimating = false;

    this._isPlaying = false;

    this.scene = new Scene();

    var aspect = window.innerWidth / window.innerHeight;

    this.camera = new OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.01,
      100
    );

    this.camera.position.z = 20;

    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
    });

    this.renderer.setClearColor(0x000000);
    this.renderer.setClearAlpha(0);

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));

    var newColors = [];

    let i = 0;

    const colorArray = opts.colors ? opts.colors : defaultColors;

    while (i < colorArray.length) {
      var rgb = hexRgb(colorArray[i]);

      newColors.push([rgb.red / 255, rgb.green / 255, rgb.blue / 255]);

      i++;
    }

    // console.log(colors)

    this.mesh = new Mesh(newColors, limit);

    this.scene.add(this.mesh);

    this.mesh.scale.set(5, 5, 5);

    this.updateEvent = this.update.bind(this);

    this.currentTime = 0;

    this.resize({
      w: window.innerWidth,
      h: window.innerHeight,
    });

    this.resizeEvent = this.resize.bind(this);

    window.addEventListener("resize", this.resizeEvent);
  }
  update() {
    this.currentTime += (Date.now() - this.lastDate) / 1000;

    this.mesh.setTimer(Math.min(limit - 0.01, this.currentTime));

    this.renderer.render(this.scene, this.camera);

    this.lastDate = Date.now();
  }
  resize(opts = {}) {
    this.w = opts.w;

    this.h = opts.h;

    // this.camera.aspect = w / h

    // this.camera.updateProjectionMatrix()

    var aspect = this.w / this.h;

    this.aspect = aspect;
    this.camera.left = (-frustumSize * aspect) / 2;
    this.camera.right = (frustumSize * aspect) / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = -frustumSize / 2;

    this.camera.updateProjectionMatrix();

    // this.camera.left = - 0.5 * frustumSize * aspect / 2;
    // this.camera.right = 0.5 * frustumSize * aspect / 2;
    // this.camera.top = frustumSize / 2;
    // this.camera.bottom = - frustumSize / 2;
    // this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.w, this.h);
  }

  play(e) {
    if (e == null) {
      e = {
        x: 0.5,
        y: 0.5,
      };
    }

    console.log(frustumSize, this.aspect, e.x, e.y);

    this.mesh.position.x = Mix(
      (-frustumSize * this.aspect) / 2,
      (frustumSize * this.aspect) / 2,
      e.x
    );
    this.mesh.position.y = Mix(
      -frustumSize * 0.5,
      frustumSize * 0.5,
      1.0 - e.y
    );

    return new Promise((resolve) => {
      if (this.isAnimating) {
        console.warn("animating already");

        return;
      }

      this.isAnimating = true;

      this.currentTime = 0;

      this.lastDate = Date.now();

      // if(this._isPlaying) {

      //   console.warn('webgl already playing')

      //   resolve()
      // }

      this._isPlaying = true;

      mediator.animationLoop.add(this.updateEvent);

      mediator.delayedCall(limit, () => {
        this.isAnimating = false;

        resolve();
      });
    });
  }
  pause() {
    return new Promise((resolve, reject) => {
      if (this._isPlaying == false) {
        resolve();

        return;
      }

      mediator.animationLoop.remove(this.updateEvent);

      this._isPlaying = false;

      resolve();
    });
  }

  destroy() {
    document.body.removeChild(this.canvas);

    window.removeEventListener("resize", this.resizeEvent);

    this.resizeEvent = null;

    this.canvas = null;
    this.pause();
    this.mesh.destroy?.();
    this.renderer.dispose();
  }
}
