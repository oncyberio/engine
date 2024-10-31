import { FirstPersonCameraControlsWrapper } from "./wrapper";

class FirstPersonCameraControls {
  get(opts) {
    return new FirstPersonCameraControlsWrapper(opts);
  }
}

export default new FirstPersonCameraControls();
