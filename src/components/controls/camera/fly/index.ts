import { FlyCameraControlsWrapper } from "./wrapper";

class FlyCameraControls {
  get(opts) {
    return new FlyCameraControlsWrapper(opts);
  }
}

export default new FlyCameraControls();
