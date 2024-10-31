import { AudioListener } from "three";

/**
 * @type {AudioListener}
 */
let audioListener = null;

if (__BUILD_TARGET__ === "web") {
  audioListener = new AudioListener();
}

export default audioListener;
