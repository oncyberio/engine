import {
  IS_MOBILE,
  IS_TOUCH,
  IS_VR,
  QUALITY,
  ORIENTATION,
  OS,
} from "engine/constants";

/**
 * Device information
 *
 * @public
 */
export class Device {
  /**
   * Is the device mobile
   */
  static get isMobile() {
    return IS_MOBILE;
  }

  /**
   * Is the device using touch controls
   */
  static get isTouch() {
    return IS_TOUCH;
  }

  /**
   * Is the device using VR
   */
  static get isVR() {
    return IS_VR;
  }

  /**
   * Device quality setting
   */
  static get quality() {
    return QUALITY;
  }

  /**
   * Device orientation
   */
  static get orientation(): string {
    return ORIENTATION;
  }

  /**
   * Device language
   */
  static get language() {
    return navigator.language;
  }

  /**
   * Device OS
   */
  static get os() {
    //
    return OS as { name: string; version: string };
  }
}
