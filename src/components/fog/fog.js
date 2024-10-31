import { Fog as THREEFog } from "three";

export default class Fog extends THREEFog {
  constructor(background, opts) {
    if (background?.isColor) {
      super(background.getHex(), opts?.near, opts?.far, null, opts?.fadeColor);
    } else {
      super(0xffffff, opts?.near, opts?.far, background, opts?.fadeColor);
    }
  }
}
