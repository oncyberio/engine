import DebugOrbitControls from "./camera/debugorbit";
import Platformer2Controls, { Platformer2ControlParams } from "./platformer2";
import ThirdPersonCameraControls from "./camera/thirdperson";
import FlyCameraControls from "./camera/fly";
import FirstPersonCameraControls from "./camera/firstperson";
import { FirstPersonCameraControlsWrapper } from "./camera/firstperson/wrapper";
import {
  ThirdPersonCameraControlsWrapper,
  ThirdPersonCameraControlsWrapperParams,
} from "./camera/thirdperson/wrapper";
import { DebugOrbitControlsWrapper } from "./camera/debugorbit/wrapper";
import { FlyCameraControlsWrapper } from "./camera/fly/wrapper";
import SpaceFactory from "engine/space";
import type { PlatformerController as PlatformerController2 } from "./platformer2/platformer2controller";

export type ControlsType =
  | "platformer2"
  | "thirdperson"
  | "firstperson"
  | "debugorbit"
  | "fly";

export type ControlsParams = {
  debugorbit: {};
  thirdperson: ThirdPersonCameraControlsWrapperParams;
  firstperson: {};
  fly: {};
  smoothpf: {};
  platformer2: Platformer2ControlParams;
};

//
export interface ControlsFactoryOpts {
  /**
   * The type of controls to create.
   */
  type: ControlsType;

  /**
   * The parameters to pass to the controls constructor.
   *
   * @remarks
   * the params depend on the type of controls:
   *
   * - For "platformer", see {@link PlatformerControlsWrapperParams} constructor
   *
   * - For "thirdperson", see {@link ThirdPersonCameraControlsWrapperParams} constructor
   *
   * - For "firstperson", no params are required
   *
   * - For "debugorbit", no params are required
   *
   * - For "fly", no params are required for now
   */
  params?: ControlsParams[ControlsType];

  /**
   * The target object to control, See the docs for each type for more info
   */
  target?: any;

  /**
   * The object to control, See the docs for each type for more info
   */
  object?: any;
}

type ControllerInstance =
  | DebugOrbitControlsWrapper
  | PlatformerController2
  | ThirdPersonCameraControlsWrapper
  | FirstPersonCameraControlsWrapper
  | FlyCameraControlsWrapper;

/**
 * @public
 *
 * Use this to create controls for your game, Currently supports the following types:
 *
 * - {@link PlatformerControlsWrapper} for a WASD + Space type of navigation
 *
 * - {@link ThirdPersonCameraControlsWrapper} for a third person camera movement
 *
 * - {@link FirstPersonCameraControlsWrapper} for a first person camera movement
 *
 * - {@link DebugOrbitControlsWrapper} for a debug orbit camera movement
 *
 * - {@link FlyCameraControlsWrapper} for a fly camera movement
 *
 * - {@link DefaultControlsWrapper} for a WASD + Space type of navigation
 *
 */
export class ControlsFactory {
  private controllerFor = new WeakMap<any, ControllerInstance>();

  /**
   * Factory method to create control. The controls returned depend on the type of controls you want to create.
   * Currently supports the following types: "platformer", "thirdperson", "firstperson", "debugorbit", "fly".
   */
  get(opts: ControlsFactoryOpts) {
    let plat = null;

    if (opts.type === "debugorbit") {
      plat = DebugOrbitControls.get(opts);
    } else if (opts.type === "platformer2") {
      plat = Platformer2Controls.get(opts);
    } else if (opts.type === "thirdperson") {
      plat = ThirdPersonCameraControls.get(opts);
    } else if (opts.type === "firstperson") {
      plat = FirstPersonCameraControls.get(opts);
    } else if (opts.type === "fly") {
      plat = FlyCameraControls.get(opts);
    } else {
      console.error("ControlsFactory: Invalid type", opts.type);
    }

    SpaceFactory.disposables.push(plat);

    this.controllerFor.set(opts.object, plat);

    return plat;
  }

  /**
   * Returns an existing controller instance for the given object, if one exists.
   * @param obj - The controlled object
   * @returns The controller instance
   */
  getControllerFor(obj: any): ControllerInstance | null {
    return this.controllerFor.get(obj);
  }
}

export default new ControlsFactory();
