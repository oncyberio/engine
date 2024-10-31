import { ThirdPersonCameraControlsWrapper } from "./wrapper";

class ThirdPersonCameraControls {
  get(opts) {
    return new ThirdPersonCameraControlsWrapper(opts);
  }
}

export default new ThirdPersonCameraControls();
