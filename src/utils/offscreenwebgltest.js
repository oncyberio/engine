const isOffscreenWebGL = function (
  SUPPORT_OFFSCREEN_CANVAS,
  WEB_WORKER_SUPPORT
) {
  var supportOffscreenWebGL = false;

  if (SUPPORT_OFFSCREEN_CANVAS == true && WEB_WORKER_SUPPORT == true) {
    var canvas = document.createElement("canvas");

    const offscreenCanvas = canvas.transferControlToOffscreen();

    const offscreenContext = offscreenCanvas.getContext("webgl2");

    supportOffscreenWebGL = offscreenContext != null;
  }

  return supportOffscreenWebGL;
};

export default isOffscreenWebGL;
