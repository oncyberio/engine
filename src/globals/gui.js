import { DEBUG } from "engine/constants";

let datgui = null;

if (__BUILD_TARGET__ == "web") {
  if (DEBUG) {
    const DAT = require("dat.gui");

    let GUI = DAT.GUI;

    datgui = new GUI();

    datgui.domElement.style.position = "absolute";

    datgui.domElement.style.top = "15px";

    datgui.folders = {};

    setTimeout(() => {
      datgui.domElement.parentElement.style.cssText +=
        "z-index: 10000 !important";
    }, 1000);
  }
}

export default datgui;
