import helper from "engine/utils/fbohelper.js";

import Emitter from "engine/events/emitter";

import { FBO_DEBUG } from "engine/constants";

import Renderer from "engine/renderer";

import Events from "engine/events/events";

var FBOHelper = null;

if (FBO_DEBUG) {
  var FBOHelper = new helper(Renderer);

  FBOHelper.setSize(window.innerWidth, window.innerHeight);

  Emitter.on(Events.RESIZE, (w, h) => {
    FBOHelper.setSize(w, h);
  });

  Emitter.on(Events.POST_UPDATE, () => {
    let older = Renderer.getRenderTarget();

    FBOHelper.update();

    Renderer.setRenderTarget(older);
  });
} else {
  FBOHelper = {
    attach: () => {},
  };
}

export default FBOHelper;
