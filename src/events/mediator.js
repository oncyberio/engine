// @ts-check

import emitter from "engine/events/emitter";

// import Renderer from '@3renderer'

import {
  DEBUG,
  CANVAS,
  DPI,
  SET_VIEW,
  SET_REAL_VIEW,
  IS_TOUCH,
  SET_ORIENTATION,
  LANDSCAPE,
  PORTRAIT,
  IS_POINTER_LOCK,
  FPS,
  IS_VR,
  SET_REAL_DPI,
} from "engine/constants";

var LOCAL_EVENTS = {
  TOUCH_MOVE: "touchmove",

  TOUCH_START: "touchstart",

  TOUCH_END: "touchend",

  TOUCH_CANCEL: "touchcancel",
};

import Events from "engine/events/events";

import { Vector3 } from "three";

import { resizer } from "engine/utils/resizer.js";
import { AnimationLoop } from "./loop";

const pos1 = new Vector3();

const pos2 = new Vector3();

class mediator {
  constructor() {
    this._lastPlaying = false;

    this._isPlaying = false;

    this.animationLoop = new AnimationLoop();

    this.now = Date.now();

    this.absTimer = 0;

    this.w = 0;

    this.h = 0;

    this.lastW = 0;

    this.lastH = 0;

    this.timeStampTap = null;

    this.mousemoveRef = this.mousemove.bind(this);

    this.mousedownRef = this.mousedown.bind(this);

    this.mouseupRef = this.mouseup.bind(this);

    this.updateEvent = this.update.bind(this);

    this.mouseWheelRef = this.mouseWheel.bind(this);

    this.keydownRef = this.keydown.bind(this);

    this.keyupRef = this.keyup.bind(this);

    this.pointerLockRef = this.pointerLock.bind(this);

    this.dblClickRef = this.dblClick.bind(this);

    this.canvasBoundingRect = {
      left: 0,

      top: 0,
    };

    this.isDragging = false;

    this.firstTouch = {};

    this.endTouch = {
      normalized: {
        x: 0,
        y: 0,
      },

      raw: {
        x: 0,
        y: 0,
      },
    };

    /** @type { Record<number, { startX: number, startY : number, clientX: number, clientY: number, dx: number, dy: number }> } */
    this.touches = {};

    this.multitouch = false;

    this.isPinching = false;

    this.mouseMovedStorage = null;

    this.mouseUpStorage = null;

    this.mouseDownStorage = null;

    this.mouseClickStorage = null;

    this.mouseDblClickStorage = null;

    this.wheelStorage = null;

    this.mousemovePackets = [];

    this.pinchZoomStorage = null;

    this.pinchStartStorage = null;

    this.pinchEndStorage = null;

    // fill dummy
    /** @type { object } */
    this.lastMouseDown = {
      normalized: {
        x: 0,

        y: 0,
      },

      raw: {
        x: 0,

        y: 0,
      },
    };

    if (DEBUG) {
      // @ts-ignore
      globalThis.mediator = this;
    }
  }

  delayedCall(delay, callback) {
    //
    return this.animationLoop.delayedCall(delay, callback);
  }

  play = () => {
    return new Promise(async (resolve, reject) => {
      //if( IS_RECORDING ) {

      //	return
      //}

      if (this._isPlaying) {
        console.warn("webgl already playing");

        resolve();

        return;
      }

      this.addEvents();

      this.now = Date.now();

      this.animationLoop.add(this.updateEvent);

      this._isPlaying = true;

      emitter.emit(Events.PLAY, null);

      resolve();
    });
  };
  pause = () => {
    return new Promise((resolve, reject) => {
      if (this._isPlaying == false) {
        console.warn("webgl already paused");

        resolve();

        return;
      }

      this.removeEvents();

      this._isPlaying = false;

      emitter.emit(Events.PAUSE, null);

      resolve();
    });
  };

  update(force = false, deltaForce = null) {
    let tempnow = Date.now();

    let delta = (tempnow - this.now) / 1000;

    if (force == true) {
      delta = 0;
    }

    //if ( deltaForce != null && IS_RECORDING ) {
    if (deltaForce != null && false) {
      delta = deltaForce;
    }

    if (this.mouseDownStorage != null) {
      emitter.emit(Events.MOUSE_DOWN, this.mouseDownStorage);

      this.mouseDownStorage = null;
    }

    if (this.mouseMovedStorage != null) {
      this.mouseMovedStorage.mousemovePackets = this.mousemovePackets;

      emitter.emit(Events.MOUSE_MOVE, this.mouseMovedStorage);

      this.mouseMovedStorage = null;

      this.mousemovePackets = [];
    }

    if (this.mouseUpStorage != null) {
      emitter.emit(Events.MOUSE_UP, this.mouseUpStorage);

      this.mouseUpStorage = null;
    }

    if (this.mouseClickStorage != null) {
      emitter.emit(Events.CLICK, this.mouseClickStorage);

      this.mouseClickStorage = null;
    }

    if (this.mouseDblClickStorage != null) {
      emitter.emit(Events.DBL_CLICK, this.mouseDblClickStorage);

      this.mouseDblClickStorage = null;
    }

    if (this.wheelStorage != null) {
      emitter.emit(Events.WHEEL, this.wheelStorage);

      this.wheelStorage = null;
    }

    if (this.pinchStartStorage != null) {
      emitter.emit(Events.PINCH_START, this.pinchStartStorage);

      this.pinchStartStorage = null;
    }

    if (this.pinchEndStorage != null) {
      emitter.emit(Events.PINCH_END, this.pinchEndStorage);

      this.pinchEndStorage = null;
    }

    if (this.pinchZoomStorage != null) {
      emitter.emit(Events.PINCH_ZOOM, this.pinchZoomStorage);

      this.pinchZoomStorage = null;
    }

    this.now = tempnow;

    this.absTimer += delta;

    // window.isMoving && console.group("UPDATE");

    emitter.emit(Events.DAWN_UPDATE, delta, this.absTimer);

    emitter.emit(Events.PRE_UPDATE, delta, this.absTimer);

    emitter.emit(Events.PHYSICS_UPDATE, delta, this.absTimer);

    emitter.emit(Events.JUST_AFTER_PHYSICS_UPDATE, delta, this.absTimer);

    emitter.emit(Events.AFTER_PHYSICS_UPDATE, delta, this.absTimer);

    emitter.emit(Events.BEFORE_RENDER, delta, this.absTimer);

    emitter.emit(Events.UPDATE, delta, this.absTimer);

    emitter.emit(Events.POST_UPDATE, delta, this.absTimer);

    emitter.emit(Events.DUSK_UPDATE, delta, this.absTimer);

    // window.isMoving && console.groupEnd();
  }

  addEvents() {
    if (IS_TOUCH) {
      CANVAS.addEventListener(LOCAL_EVENTS.TOUCH_MOVE, this.mousemoveRef);

      CANVAS.addEventListener(LOCAL_EVENTS.TOUCH_START, this.mousedownRef);

      CANVAS.addEventListener(LOCAL_EVENTS.TOUCH_END, this.mouseupRef);

      CANVAS.addEventListener(LOCAL_EVENTS.TOUCH_CANCEL, this.mouseupRef);
    } else {
      window.addEventListener("mouseleave", this.mouseLeave.bind(this));

      CANVAS.addEventListener(Events.MOUSE_MOVE, this.mousemoveRef);

      CANVAS.addEventListener(Events.MOUSE_DOWN, this.mousedownRef);

      CANVAS.addEventListener(Events.MOUSE_UP, this.mouseupRef);

      window.addEventListener(Events.KEY_DOWN, this.keydownRef);

      window.addEventListener(Events.KEY_UP, this.keyupRef);

      CANVAS.addEventListener(Events.DBL_CLICK, this.dblClickRef);

      // CANVAS.addEventListener(Events.CLICK,   this.clickRef)

      CANVAS.addEventListener(Events.WHEEL, this.mouseWheelRef, false);

      document.addEventListener(Events.POINTER_LOCK, this.pointerLockRef);
    }
  }

  removeEvents() {
    if (IS_TOUCH) {
      CANVAS.removeEventListener(Events.TOUCH_MOVE, this.mousemoveRef);

      CANVAS.removeEventListener(Events.TOUCH_START, this.mousedownRef);

      CANVAS.removeEventListener(Events.TOUCH_END, this.mouseupRef);
    } else {
      CANVAS.removeEventListener(Events.DBL_CLICK, this.dblClickRef);

      CANVAS.removeEventListener(Events.MOUSE_MOVE, this.mousemoveRef);

      CANVAS.removeEventListener(Events.MOUSE_DOWN, this.mousedownRef);

      CANVAS.removeEventListener(Events.MOUSE_UP, this.mouseupRef);

      window.removeEventListener(Events.KEY_DOWN, this.keydownRef);

      window.removeEventListener(Events.KEY_UP, this.keyupRef);
      // CANVAS.removeEventListener(Events.CLICK,   this.clickRef)

      CANVAS.removeEventListener(Events.WHEEL, this.mouseWheelRef);

      document.removeEventListener(Events.POINTER_LOCK, this.pointerLockRef);
    }
  }

  mousedown = (e) => {
    this.isDragging = true;

    if (e.changedTouches) {
      e.preventDefault();

      for (let i = 0; i < e.changedTouches.length; i++) {
        let touch = e.changedTouches[i];

        this.touches[touch.identifier] = {
          startX: touch.clientX,
          startY: touch.clientY,
          clientX: touch.clientX,
          clientY: touch.clientY,
          dx: 0,
          dy: 0,
        };
      }

      // if(e.targetTouches.length > 1) {

      //              this.multitouch = true

      //              if(e.targetTouches.length === 2) {

      //                  const pinchDistance = this.distance(e.targetTouches[0], e.targetTouches[1])

      //                  this.pinchStartStorage = {
      //                      pinchDistance
      //                  }

      //                  this.prevPinchDistance = pinchDistance

      //                  this.isPinching = true
      //              }
      //              else {

      //                  this.prevPinchDistance = null
      //              }

      //              return
      //          }
    }

    this.timeStampTap = Date.now();

    this.mouseDownStorage = this.getMouseData(e);

    this.lastMouseDown = this.getMouseData(e);
  };

  mouseLeave(e) {
    if (this.isDragging == true) {
      this.mouseup(e);
    }

    emitter.emit(Events.MOUSE_LEAVE, e);
  }

  mouseup(e) {
    this.isDragging = false;

    if (e.changedTouches) {
      e.preventDefault();

      for (let i = 0; i < e.changedTouches.length; i++) {
        let touch = e.changedTouches[i];

        delete this.touches[touch.identifier];
      }

      if (e.targetTouches.length != 2) {
        this.prevPinchDistance = null;

        this.pinchZoomStorage = null;

        if (this.isPinching) {
          this.pinchEndStorage = {};

          this.isPinching = false;
        }

        this.pinchStartStorage = null;
      }

      if (e.targetTouches.length < 2) {
        this.multitouch = false;
      }
    }

    if (this.multitouch) return;

    this.mouseUpStorage = this.getMouseData(e);

    let distance;

    if (e.isVR) {
      pos1.setFromMatrixPosition(this.mouseUpStorage.controller.matrixWorld);

      pos2.setFromMatrixPosition(this.lastMouseDown.controller.matrixWorld);

      if (pos1.distanceToSquared(pos2) < 0.1) {
        this.mouseClickStorage = this.mouseUpStorage;
      }
    } else {
      const a = this.mouseUpStorage.raw.x - this.lastMouseDown.raw.x;

      const b = this.mouseUpStorage.raw.y - this.lastMouseDown.raw.y;

      distance = Math.sqrt(a * a + b * b);
    }

    const dt = Date.now() - this.timeStampTap;

    if (distance < 10 && dt < 1000) {
      this.mouseClickStorage = this.getMouseData(e);
    }
  }

  click(e) {
    this.mouseClickStorage = this.getMouseData(e);
  }

  mousemove(ev) {
    if (ev.changedTouches) {
      for (let i = 0; i < ev.changedTouches.length; i++) {
        const touch = ev.changedTouches[i];

        let tcache = this.touches[touch.identifier];

        if (tcache) {
          tcache.dx = touch.clientX - tcache.clientX;

          tcache.dy = touch.clientY - tcache.clientY;

          tcache.clientX = touch.clientX;

          tcache.clientY = touch.clientY;
        }
      }

      if (ev.targetTouches.length === 2) {
        this.handlePinchZoom(ev);
      }

      if (this.multitouch) return;
    }

    let data = this.getMouseData(ev);

    if (ev.isVR) {
      //
    } else {
      data.origin = {
        normalized: this.lastMouseDown.normalized,

        raw: this.lastMouseDown.raw,
      };
    }

    this.mousemovePackets.push(data);

    this.mouseMovedStorage = data;

    // emitter.emit(Events.MOUSE_MOVE, this.mouseMovedStorage )
  }

  handlePinchZoom(ev) {
    let touch1 = ev.targetTouches[0];

    let touch2 = ev.targetTouches[1];

    let tcache1 = this.touches[touch1.identifier];

    let tcache2 = this.touches[touch2.identifier];

    if (tcache1 != null && tcache2 != null) {
      // let diff1 = Math.hypot(Math.abs(tcache1.startX - tcache1.clientX), Math.abs(tcache1.startY - tcache1.clientY))

      // let diff2 = Math.hypot(Math.abs(tcache2.startX - tcache2.clientX), Math.abs(tcache2.startY - tcache2.clientY))

      // if (diff1 >= PINCH_THRESHOLD || diff2 >= PINCH_THRESHOLD) {

      const pinchDistance = this.distance(touch1, touch2);

      if (this.prevPinchDistance) {
        if (this.pinchZoomStorage == null) {
          this.pinchZoomStorage = {
            pinchDelta: 0,

            pinchDistance,
          };
        }

        const pinchDelta = pinchDistance - this.prevPinchDistance;

        this.pinchZoomStorage.pinchDelta += pinchDelta;

        this.pinchZoomStorage.direction = Math.sign(pinchDelta);

        this.isPinching = true;
      }

      this.prevPinchDistance = pinchDistance;

      // }
    }
  }

  distance(p1, p2) {
    let dx = Math.abs(p1.clientX - p2.clientX);

    let dy = Math.abs(p1.clientY - p2.clientY);

    return Math.hypot(dx, dy);
  }

  pointerLock(ev) {
    ev.isPointerLock = IS_POINTER_LOCK();

    emitter.emit(Events.CUSTOM, {
      type: Events.POINTER_LOCK,
      value: ev,
    });
  }

  canHandleKeyEvent(ev) {
    return (
      ev.target === CANVAS ||
      ev.target === CANVAS.parentElement ||
      ev.target === document.body ||
      ev.target !== document.activeElement
    );
  }

  keydown(ev) {
    if (!this.canHandleKeyEvent(ev)) {
      // console.log('cannot handle key event', ev.target, document.activeElement)

      return;
    }

    emitter.emit(Events.KEY_DOWN, ev);
  }

  keyup(ev) {
    if (!this.canHandleKeyEvent(ev)) return;

    emitter.emit(Events.KEY_UP, ev);
  }

  getMouseData(ev) {
    if (ev.isVR) {
      return {
        isVR: true,

        isDragging: this.isDragging,

        controller: ev.controller,

        index: ev.index,
      };
    }

    let dx = 0;

    let dy = 0;

    let multitouch = false;

    if (ev.changedTouches && ev.changedTouches[0]) {
      // console.log(ev.changedTouches)
      // console.log(ev.changedTouches.length)

      if (ev.changedTouches.length > 1) {
        multitouch = true;
      }

      ev = ev.changedTouches[0];

      let tc = this.touches[ev.identifier];

      if (tc != null) {
        dx = tc.dx;

        dy = tc.dy;
      }
    } else {
      dx = ev.movementX ?? 0;

      dy = ev.movementY ?? 0;
    }

    const rect = this.canvasBoundingRect;

    // console.log( multitouch )

    return {
      rawEvent: ev,

      multitouch: multitouch,

      isDragging: this.isDragging,

      time: Date.now(),

      normalized: {
        x: ((ev.clientX - rect.left) / rect.width) * 2 - 1,

        y: ((ev.clientY - rect.top) / rect.height) * 2 - 1,
      },

      raw: {
        x: ev.clientX,

        y: ev.clientY,

        dx,

        dy,

        screenX: ev.screenX,

        screenY: ev.screenY,

        ctrlKey: ev.ctrlKey,

        shiftKey: ev.shiftKey,

        metaKey: ev.metaKey,

        button: ev.button ?? 0,
      },
    };
  }

  dblClick(e) {
    e.preventDefault();

    this.mouseDblClickStorage = this.getMouseData(e);
  }

  mouseWheel(e) {
    this.wheelStorage = e;
  }

  resize(opts) {
    if (opts == null || (!opts.w && !opts.h)) {
      opts = {
        w: this.lastW,

        h: this.lastH,

        ...opts,
      };
    }

    // console.log('RESIZE ', opts )

    this.w = opts.w;

    this.h = opts.h;

    this.fullFrameX = opts.w;

    this.fullFrameY = opts.h;

    // console.log('')

    if (opts.force == null || opts.force == false) {
      this.lastW = opts.w;

      this.lastH = opts.h;

      let { width, height } = resizer(
        this.fullFrameX * DPI,
        this.fullFrameY * DPI
      );

      this.w = Math.round(width / DPI);

      this.h = Math.round(height / DPI);

      // console.log('RESIZE', this.w, this.h)
    }

    // Seems the canvas bounds are not yet updated to their new values on this event
    // TODO: investigate why
    setTimeout(() => {
      this.updateCanvasBounds();
    });

    SET_VIEW(this.w, this.h);

    SET_REAL_VIEW(this.fullFrameX, this.fullFrameY);

    SET_ORIENTATION(
      window.matchMedia("(orientation: landscape)").matches
        ? LANDSCAPE
        : PORTRAIT
    );

    emitter.emit(Events.RESIZE, this.w, this.h);

    // emitter.emit(Events.POST_RESIZE, this.w, this.h);

    if (CANVAS != null) {
      CANVAS.style.width = `${this.fullFrameX}px`;

      CANVAS.style.height = `${this.fullFrameY}px`;
    }

    SET_REAL_DPI(parseFloat(((this.w / this.fullFrameX) * DPI).toFixed(3)));

    if (this._isPlaying == false) {
      this.update(true);
    }
  }

  updateCanvasBounds() {
    const rect = CANVAS.getBoundingClientRect();

    this.canvasBoundingRect.left = rect.left;

    this.canvasBoundingRect.top = rect.top;

    this.canvasBoundingRect.width = rect.width;

    this.canvasBoundingRect.height = rect.height;
  }
}

export default new mediator();
