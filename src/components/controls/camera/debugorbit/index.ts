import { DebugOrbitControlsWrapper } from "./wrapper";

class DebugOrbitControls {
  get(opts) {
    return new DebugOrbitControlsWrapper(opts);
  }
}

export default new DebugOrbitControls();
