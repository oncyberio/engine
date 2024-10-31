import EventEmitter from "./_eventemitter.js";

import { DEBUG, FRONT_END } from "engine/constants";

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

/**
 * @public
 **/
let emitter = new EventEmitter();

emitter.on_prior = emitter.prependListener.bind(emitter);

emitter.setMaxListeners(100);

emitter.getEventCount = () => {
  let keys = Object.keys(emitter._events);

  let cc = 0;

  let i = 0;

  while (i < keys.length) {
    if (emitter._events[keys[i]].length) {
      cc += emitter._events[keys[i]].length;
    }

    i++;
  }

  return cc;
};

globalThis.thatemitter = emitter;

if (DEBUG) {
  globalThis.emitter = emitter;
}

export default emitter;
