import {
  CharacterCollision,
  Collider,
  KinematicCharacterController,
  RigidBody,
  VectorOps,
} from "@dimforge/rapier3d";
import { ControlsAbstract } from "../abstract";
import { Physics } from "engine/components/physics";
import { Collider as InternalCollider } from "engine/components/physics/rapier/rigidbody/collider";
import Emitter from "engine/events/emitter";
import Events from "engine/events/events";
import { Object3D, Quaternion, Vector2, Vector3 } from "three";
import { IntersectionEvent } from "engine/components/physics/rapier/intersectionevent";
import { CharacterCollisionEvent } from "engine/components/physics/rapier/charactercollisionevent";
import GUI from "engine/globals/gui";
import { DEBUG } from "engine/constants";

const v = new Vector3();
const v3Temp = new Vector3();
const v2Temp0 = new Vector2();
const v2Temp1 = new Vector2();
const quatTemp = new Quaternion();
const up = new Vector3(0, 1, 0);
const pi2 = Math.PI * 2;

function clamp(t: number, min = 0, max = 1): number {
  return Math.min(Math.max(t, Math.min(min, max)), Math.max(min, max));
}
function normalizeAngle(t: number): number {
  return ((t % pi2) + pi2) % pi2;
}
function smallestAngleBetween(a: number, b: number): number {
  const difference = normalizeAngle(b - a);

  return difference < Math.PI ? difference : -(pi2 - difference);
}

enum Direction {
  forwards,
  backwards,
  left,
  right,
}

const joystickToDirection = new Map<string, Direction>([
  ["up", Direction.forwards],
  ["down", Direction.backwards],
  ["left", Direction.left],
  ["right", Direction.right],
]);

enum Modifier {
  sprint = 100,
}

export interface PlatformerControlParams {
  /** Time in seconds until the peak of a normal jump is reached */
  timeToJumpApex: number;
  /** Time in seconds it takes to fall back to the ground from the peak of a normal jump */
  timeToGround: number;
  /** Height of a normal jump */
  jumpAltitude: number;
  /** Time in seconds the jump key needs to be held down to turn a normal jump into a high jump */
  highJumpCheckTime: number;
  /** Time in seconds until the peak of a high jump is reached */
  timeToHighJumpApex: number;
  /** Height of a high jump */
  highJumpAltitude: number;
  /** Number of jumps that can be performed (without touching the ground in between) */
  maxJumps: number;

  /** Time in seconds until full acceleration is applied */
  accelerationTime: number;

  /** Time in seconds until full ground friction is applied */
  decelerationTime: number;

  /** Maximum speed in units per second achievable by walking */
  walkSpeed: number;

  /** How much faster sprinting is compared to walking */
  sprintBoost: number;

  /** Maximum acceleration due to walking in units per second squared */
  maxAcceleration: number;

  /** Grace period in seconds in which a jump still registers after the player has left the ground */
  coyoteTime: number;

  /** Scalar applied to friction force applied to the character by scene geometry. 0 = no friction, 2 = double the normal friction */
  groundFrictionScale: number;
  /** How much 'grip' the character has when walking. This mostly influences the ability to walk/brake on slippery surfaces. 1 = normal traction, 2 = double the normal traction */
  groundTractionScale: number;
  /** Speed applied when pressing directional keys during a jump which was started with no
   * directional component, i.e. straight up. In units per second.
   */
  jumpLateDirectionalCorrectionSpeed: number;
  /** Speed applied when pressing directional keys when starting an air jump, in units per second */
  airJumpDirectionalSpeed: number;
  /** Speed in units per second at which directional inputs no longer have any effect */
  airControlMaxLinearVelocity: number;

  /** Speed in radians per second of how fast the character turns to match the desired direction during a jump*/
  airControlAngularVelocity: number;

  /** Maximum height of a step the character can automatically walk up */
  maxStepHeight: number;
  /** Minimum width of a surface to be considered a walkable step */
  minStepWidth: number;
  /** Maximum altitude above the ground under which the character will be automatically snapped to the ground */
  snapToGroundHeight: number;
  /** Whether to enable sliding down steep slopes */
  enableSliding: boolean;
  /** Maximum angle of a slope considered climbable, in radians */
  maxSlopeClimbAngle: number;
  /** Minimum slope angle to start sliding, in radians */
  minSlopeSlideAngle: number;
  /** Whether the character should 'move' dynamic objects when colliding. */
  applyImpulsesToDynamicBodies: boolean;
  /** Wheather to automatically play back animations on the avatar. */
  autoAnimate: boolean;
  /** Smoothing applied to the visual character orientation. 0 = no smoothing, >0.2 = heavy smoothing */
  orientationSmoothing: number;
}

const optLimits: Record<
  keyof PlatformerControlParams,
  {
    min: number;
    max: number;
    step: number;
  } | null
> = {
  timeToJumpApex: {
    min: 0.1,
    max: 1,
    step: 0.01,
  },
  timeToGround: {
    min: 0.1,
    max: 1,
    step: 0.01,
  },
  jumpAltitude: {
    min: 0.5,
    max: 50,
    step: 0.1,
  },
  highJumpCheckTime: {
    min: 0.02,
    max: 0.2,
    step: 0.01,
  },
  timeToHighJumpApex: {
    min: 0.2,
    max: 2,
    step: 0.01,
  },
  highJumpAltitude: {
    min: 0.5,
    max: 50,
    step: 0.1,
  },
  maxJumps: {
    min: 0,
    max: 10,
    step: 1,
  },
  accelerationTime: {
    min: 0,
    max: 4,
    step: 0.1,
  },
  decelerationTime: {
    min: 0,
    max: 4,
    step: 0.1,
  },
  walkSpeed: {
    min: 1,
    max: 50,
    step: 0.25,
  },
  sprintBoost: {
    min: 1,
    max: 10,
    step: 0.25,
  },
  maxAcceleration: {
    min: 10,
    max: 1000,
    step: 0.5,
  },
  coyoteTime: {
    min: 0,
    max: 0.2,
    step: 0.01,
  },
  groundFrictionScale: {
    min: 0.5,
    max: 32,
    step: 0.25,
  },
  groundTractionScale: {
    min: 0.5,
    max: 8,
    step: 0.25,
  },
  jumpLateDirectionalCorrectionSpeed: {
    min: 0,
    max: 100,
    step: 0.1,
  },
  airJumpDirectionalSpeed: {
    min: 0,
    max: 100,
    step: 0.1,
  },
  airControlMaxLinearVelocity: {
    min: 0,
    max: 1000,
    step: 0.25,
  },
  airControlAngularVelocity: {
    min: 0,
    max: Math.PI * 2 * 10,
    step: (Math.PI * 2) / 100,
  },
  maxStepHeight: {
    min: 0,
    max: 4,
    step: 0.1,
  },
  minStepWidth: {
    min: 0.1,
    max: 2,
    step: 0.1,
  },
  snapToGroundHeight: {
    min: 0,
    max: 2,
    step: 0.1,
  },
  enableSliding: null,
  maxSlopeClimbAngle: {
    min: 0.1,
    max: Math.PI / 2,
    step: Math.PI / 100,
  },
  minSlopeSlideAngle: {
    min: 0.1,
    max: Math.PI / 2,
    step: Math.PI / 100,
  },
  applyImpulsesToDynamicBodies: null,
  autoAnimate: null,
  orientationSmoothing: {
    min: 0,
    max: 0.25,
    step: 0.01,
  },
};

// @ts-expect-error
export class PlatformerController
  extends ControlsAbstract
  implements PlatformerControlParams
{
  private physics = Physics.get({ type: "rapier", debug: true });
  private collider: Collider;
  private colliderRb: RigidBody;
  private internalCollider: InternalCollider;
  private charController: KinematicCharacterController;
  private shouldCheckJump = false;
  private potentialJumpStartTime = 0;
  private jumpReleaseTime = 0;
  private isGrounded = false;
  private jumpStartTime = 0;
  private jumpEndTime = 0;
  private jumpStartPos = new Vector3();
  private jumpStartLinearVel = new Vector3();
  private isJumping = false;
  private highJumpStarted = false;
  private jumpNumber = 0;
  private g = 0;
  private maxSpeed = 0;
  private _active = false;

  private _keyActive = true;

  private inputStart = new Map<Direction | Modifier, number>();
  private inputEnd = new Map<Direction | Modifier, number>();
  private directionalInput = new Vector3();
  private immediateDirectionalInput = new Vector3();
  private isSprinting = false;
  private lastGroundEnter = 0;
  private lastGroundLeave = 0;
  private correctionVelocityContribution = new Vector3();
  private effectiveFrictionCoefficient = 0;
  private externalImpulse = new Vector3();
  private isPushingWall = false;
  private wallNormal = new Vector3();
  private lastAnimations: Record<number, string> = {};
  private publicVelocity = new Vector3();
  private opts: PlatformerControlParams = {
    timeToJumpApex: 0.34,
    timeToHighJumpApex: 0.34,
    highJumpAltitude: 6,
    jumpAltitude: 6,
    timeToGround: 0.35,
    highJumpCheckTime: 10,
    maxJumps: 2,
    maxStepHeight: 1.5,
    minStepWidth: 0.1,
    snapToGroundHeight: 0.5,
    enableSliding: true,
    maxSlopeClimbAngle: (45 * Math.PI) / 180,
    minSlopeSlideAngle: (40 * Math.PI) / 180,
    accelerationTime: 0,
    decelerationTime: 0,
    walkSpeed: 7, // 4 to match animation
    sprintBoost: 4,
    maxAcceleration: 1000,
    jumpLateDirectionalCorrectionSpeed: 16,
    airJumpDirectionalSpeed: 24,
    airControlMaxLinearVelocity: 275,
    airControlAngularVelocity: Math.PI * 2 * 2,
    coyoteTime: 0.1,
    groundFrictionScale: 20,
    groundTractionScale: 1.5,
    applyImpulsesToDynamicBodies: true,
    autoAnimate: true,
    orientationSmoothing: 0.08,
  };

  constructor(
    opts: Partial<PlatformerControlParams> &
      ConstructorParameters<typeof ControlsAbstract>[0]
  ) {
    super(opts);

    this.collider = opts.object.collider._collider;
    this.colliderRb = opts.object.collider.rigidBody;
    this.internalCollider = opts.object.collider;

    this.internalCollider.parent._interpolate = false;
    this.internalCollider.parent._autoSyncTransform = false;

    const _offset = 0.1;
    this.charController = this.physics.world.createCharacterController(_offset);

    this.charController.setUp(up);
    this.charController.setCharacterMass(10);
    this.collider.setMass(10);

    this.updateOptions(opts);

    let gui;
    if (DEBUG) {
      gui = GUI.addFolder("PlatformerController");
    }

    Object.keys(this.opts).forEach((key) => {
      Object.defineProperty(this, key, {
        get: () => this.opts[key],
        set: (value) =>
          this.updateOptions({
            [key]: value,
          }),
      });
      if (gui && !["type", "object", "target"].includes(key)) {
        const limits = optLimits[key];
        gui.add(this, key, limits?.min, limits?.max, limits?.step);
      }
    });

    this.active = true;
  }

  private _resetInputState() {
    //
    this.inputStart.clear();

    this.inputEnd.clear();
  }

  private _resetAnimation() {
    //
    if (this.object["animation"]) {
      //
      this.object["animation"] = "idle";
    }
  }

  /**
   * activate or deactivate the controls
   */
  set active(value) {
    //
    if (value === this.active) return;

    this._active = value;

    if (value) {
      //
      this.addEvents();
    } else {
      //
      this.removeEvents();

      this._resetInputState();

      this._resetAnimation();
    }
  }

  /**
   * whether the controls are active
   */
  get active() {
    //
    return this._active;
  }

  set keyActive(value) {
    this._keyActive = value;
  }

  get keyActive() {
    return this._keyActive;
  }

  public updateOptions(opts: Partial<PlatformerControlParams>) {
    this.opts = Object.assign(this.opts, opts);

    // since a jump arc is a parabola, G is it's second derivative
    this.g = (2 * this.opts.jumpAltitude) / this.opts.timeToGround ** 2;

    this.maxSpeed = this.opts.walkSpeed * this.opts.sprintBoost;

    if (this.opts.maxStepHeight > 0) {
      this.charController.enableAutostep(
        this.opts.maxStepHeight,
        this.opts.minStepWidth,
        false
      );
    } else {
      this.charController.disableAutostep();
    }

    if (this.opts.snapToGroundHeight > 0) {
      this.charController.enableSnapToGround(this.opts.snapToGroundHeight);
    } else {
      this.charController.disableSnapToGround();
    }

    if (this.opts.enableSliding) {
      this.charController.setMaxSlopeClimbAngle(this.opts.maxSlopeClimbAngle);
      this.charController.setMinSlopeSlideAngle(this.opts.minSlopeSlideAngle);
    }

    this.charController.setApplyImpulsesToDynamicBodies(
      !!this.opts.applyImpulsesToDynamicBodies
    );
  }

  public applyImpulse(impulse: Vector3) {
    this.externalImpulse.add(impulse);
  }

  /**
   * @internal
   */
  private addEvents() {
    Emitter.on(Events.FIXED_UPDATE, this.update);
    Emitter.on(Events.AFTER_FIXED_UPDATE, this.updateVisuals);
    Emitter.on(Events.FIXED_INTERPOLATE, this.interpolate);
    Emitter.on(Events.KEY_DOWN, this.keyDown);
    Emitter.on(Events.KEY_UP, this.keyUp);
  }

  /**
   * @internal
   */
  private removeEvents() {
    Emitter.off(Events.FIXED_UPDATE, this.update);
    Emitter.off(Events.AFTER_FIXED_UPDATE, this.updateVisuals);
    Emitter.off(Events.FIXED_INTERPOLATE, this.interpolate);
    Emitter.off(Events.KEY_DOWN, this.keyDown);
    Emitter.off(Events.KEY_UP, this.keyUp);
  }

  /**
   * @internal
   */
  private keyUp = (event) => {
    switch (event.code) {
      case "Space":
        this.endJump(event.timeStamp);
        break;

      case "ShiftLeft":
        this.endInput(event.timeStamp, Modifier.sprint);
        break;

      case "KeyW":
      case "ArrowUp":
        this.endInput(event.timeStamp, Direction.forwards);
        break;

      case "KeyS":
      case "ArrowDown":
        this.endInput(event.timeStamp, Direction.backwards);
        break;

      case "KeyD":
      case "ArrowRight":
        this.endInput(event.timeStamp, Direction.right);
        break;

      case "KeyA":
      case "ArrowLeft":
        this.endInput(event.timeStamp, Direction.left);
        break;
    }
  };

  /**
   * @internal
   */
  private keyDown = (event) => {
    if (event.repeat) return;

    switch (event.code) {
      case "Space":
        if (this.keyActive == false) {
          return;
        }
        this.beginJump(event.timeStamp);
        break;

      case "ShiftLeft":
        this.beginInput(event.timeStamp, Modifier.sprint);
        break;

      case "KeyW":
      case "ArrowUp":
        this.beginInput(event.timeStamp, Direction.forwards);
        break;

      case "KeyS":
      case "ArrowDown":
        this.beginInput(event.timeStamp, Direction.backwards);
        break;

      case "KeyD":
      case "ArrowRight":
        this.beginInput(event.timeStamp, Direction.right);
        break;

      case "KeyA":
      case "ArrowLeft":
        this.beginInput(event.timeStamp, Direction.left);
        break;
    }
  };

  private onJoystick = (event) => {
    if (event.detail.force > 0.75) {
      this.beginInput(event.timeStamp, Modifier.sprint);
    } else {
      this.endInput(event.timeStamp, Modifier.sprint);
    }

    joystickToDirection.forEach((input, key) => {
      if (event.detail.dirs.includes(key)) {
        this.beginInput(event.timeStamp, input);
      } else {
        this.endInput(event.timeStamp, input);
      }
    });
  };

  private onJumpButtonDown = (event) => {
    event.preventDefault();
    this.beginJump(event.timeStamp);
  };

  private onJumpButtonUp = (event) => {
    this.endJump(event.timeStamp);
  };

  /**
   * Attempts to start a jump at the given window time
   * @internal
   */
  private beginJump(windowTime: number) {
    // reject if there is a jump happening
    if ((this.jumpEndTime || Infinity) < this.jumpStartTime) return;

    this.shouldCheckJump = true;
    // this should be in simulation time, however
    // there's no access to that here
    this.potentialJumpStartTime = windowTime / 1000;
  }

  /**
   * Attempts to end a jump at the given window time
   * @internal
   */
  private endJump(windowTime: number) {
    if (!this.isJumping) return;

    // this should be in simulation time, however
    // there's no access to that here
    this.jumpReleaseTime = windowTime / 1000;
  }

  private beginInput(windowTime: number, input: Direction | Modifier) {
    if (
      (this.inputEnd.get(input) ?? Infinity) >=
      (this.inputStart.get(input) ?? 0)
    ) {
      this.inputStart.set(input, windowTime / 1000);
    }
  }

  private endInput(windowTime: number, input: Direction | Modifier) {
    if ((this.inputEnd.get(input) ?? 0) <= (this.inputStart.get(input) ?? 0)) {
      this.inputEnd.set(input, windowTime / 1000);
    }
  }

  private computeDirectionalInputContribution(
    direction: Direction,
    now: number
  ): number {
    const start = this.inputStart.get(direction) ?? Infinity;
    const end = this.inputEnd.get(direction) ?? 0;

    // clamp end of acceleration slope to start of deceleration slope, if it already happened.
    const accelerationEnd = end >= start ? end : now;

    let contrib = Math.min(
      1,
      Math.max(0, (accelerationEnd - start) / this.opts.accelerationTime)
    );

    if (end > start) {
      contrib *= Math.min(
        1,
        Math.max(
          0,
          (end - now + this.opts.decelerationTime) / this.opts.decelerationTime
        )
      );
    }

    // zero frame duration input with 0 accelerationTime or decelerationTime
    if (typeof contrib !== "number") return 0;

    return contrib;
  }

  private getImmediateDirectionalInputContribution(
    direction: Direction,
    now: number
  ): number {
    const start = this.inputStart.get(direction) ?? 0;
    const end = this.inputEnd.get(direction) ?? 0;

    // key is being held down
    if (end > now) return 1;
    // key press ends after test time
    if (end < start && end < now) return 1;

    return 0;
  }

  /**
   * @internal
   */
  private getDesiredSpeed(now: number): number {
    const start = this.inputStart.get(Modifier.sprint) ?? 0;
    const end = this.inputEnd.get(Modifier.sprint) ?? 0;

    // sprint is being held down
    if (end > now) return 1;
    // sprint key press ends after test time
    if (end < start && end < now) return 1;

    return 1 / this.opts.sprintBoost;
  }

  /**
   * @internal
   */
  private getNextAirControlAngle(
    currentAngle: number,
    desiredAngle: number,
    linearVelocity: Vector3,
    deltaTime: number
  ): number {
    const difference = smallestAngleBetween(currentAngle, desiredAngle);
    const reduction =
      1 -
      Math.min(
        1,
        linearVelocity.length() / this.opts.airControlMaxLinearVelocity
      );

    const change =
      Math.sign(difference) *
      Math.min(
        Math.abs(difference),
        this.opts.airControlAngularVelocity * reduction * deltaTime
      );

    return currentAngle + change;
  }

  /**
   * @internal
   */
  private update = (_deltaTime: number, time: number) => {
    // TEMP: clamp deltaTime to 1 to prevent weird behaviour from changing tabs
    const deltaTime = Math.min(0.05, _deltaTime);

    // this is inaccurate and needs to be removed once event timings are provided on simulaton time
    const windowTime = performance.now() / 1000;
    const simulationTimeToWindowDelta = time - windowTime;

    const pos = this.colliderRb.translation();
    // console.log(this.colliderRb.linvel());

    VectorOps.copy(v, this.colliderRb.linvel());
    v3Temp.copy(v);

    // remove velocity caused by corrections (autostep, snap to ground, etc)
    v.sub(this.correctionVelocityContribution);
    v.x = clamp(v.x, 0, v3Temp.x);
    v.y = clamp(v.y, 0, v3Temp.y);
    v.z = clamp(v.z, 0, v3Temp.z);

    this.publicVelocity.copy(v);

    // apply accumulated external impulses
    if (this.externalImpulse.length() > 0) {
      this.isGrounded = false;
      v.add(this.externalImpulse);
      this.externalImpulse.set(0, 0, 0);
    }

    if (this.keyActive) {
      // accumulate directional input
      this.directionalInput.x =
        this.computeDirectionalInputContribution(Direction.right, windowTime) -
        this.computeDirectionalInputContribution(Direction.left, windowTime);

      this.directionalInput.z =
        this.computeDirectionalInputContribution(
          Direction.backwards,
          windowTime
        ) -
        this.computeDirectionalInputContribution(
          Direction.forwards,
          windowTime
        );

      this.directionalInput.clampLength(0, 1);

      // accumulate immediate directional input
      this.immediateDirectionalInput.x =
        this.getImmediateDirectionalInputContribution(
          Direction.right,
          windowTime
        ) -
        this.getImmediateDirectionalInputContribution(
          Direction.left,
          windowTime
        );

      this.immediateDirectionalInput.z =
        this.getImmediateDirectionalInputContribution(
          Direction.backwards,
          windowTime
        ) -
        this.getImmediateDirectionalInputContribution(
          Direction.forwards,
          windowTime
        );

      this.immediateDirectionalInput.clampLength(0, 1);
    } else {
      this.directionalInput.set(0, 0, 0);
      this.immediateDirectionalInput.set(0, 0, 0);
    }

    // align directional inputs to camera
    const angle = Math.atan2(
      2 *
        (this.target.quaternion.w * this.target.quaternion.y +
          this.target.quaternion.x * this.target.quaternion.z),
      1 - 2 * (this.target.quaternion.y ** 2 + this.target.quaternion.x ** 2)
    );

    this.directionalInput.applyAxisAngle(up, angle);

    this.immediateDirectionalInput.applyAxisAngle(up, angle);

    if (this.isGrounded) {
      this.isJumping = false;
      this.jumpNumber = 0;
    } else if (
      this.jumpNumber === 0 &&
      this.lastGroundLeave + this.opts.coyoteTime > time
    ) {
      // not being grounded means that only
      // airjumps should be allowed after this
      this.jumpNumber = 1;
    }

    // end jump at jump apex
    if (this.jumpEndTime < time) {
      this.isJumping = false;
    }

    if (
      // start jump ...
      this.shouldCheckJump &&
      // ... if standing on ground
      (this.isGrounded ||
        // ... if ground was left recently enough to fall within grace period
        this.potentialJumpStartTime + simulationTimeToWindowDelta <
          this.lastGroundLeave + this.opts.coyoteTime ||
        // ... if airjumps are allowed
        this.opts.maxJumps > 1) &&
      // ... and there are jumps remaining
      this.jumpNumber < this.opts.maxJumps
    ) {
      this.jumpStartTime =
        this.potentialJumpStartTime + simulationTimeToWindowDelta;
      this.jumpEndTime = this.jumpStartTime + this.opts.timeToJumpApex;
      VectorOps.copy(this.jumpStartPos, pos);
      this.isJumping = true;
      this.highJumpStarted = false;

      if (
        this.jumpNumber > 0 &&
        this.opts.airJumpDirectionalSpeed > 0 &&
        this.immediateDirectionalInput.lengthSq() > 0.1
      ) {
        this.jumpStartLinearVel.copy(this.immediateDirectionalInput);
        this.jumpStartLinearVel.multiplyScalar(
          this.opts.airJumpDirectionalSpeed
        );
      } else {
        VectorOps.copy(this.jumpStartLinearVel, v);

        // push away from wall at walking speed
        if (this.isPushingWall) {
          v3Temp.copy(this.wallNormal);
          v3Temp.multiplyScalar(this.opts.airJumpDirectionalSpeed);
          this.jumpStartLinearVel.add(v3Temp);
        }
      }

      this.jumpNumber += 1;
    }
    this.shouldCheckJump = false;

    const desiredSpeed = this.getDesiredSpeed(windowTime);
    this.isSprinting = desiredSpeed === 1;

    if (this.isJumping) {
      // on rails

      const absHighJumpCheckTime =
        this.jumpStartTime + this.opts.highJumpCheckTime;
      const absJumpReleaseTime =
        this.jumpReleaseTime + simulationTimeToWindowDelta;

      if (
        !this.highJumpStarted &&
        // check time has passed
        time > absHighJumpCheckTime &&
        // release happened before check time
        absJumpReleaseTime < absHighJumpCheckTime &&
        // jump release time belongs to previous jump
        absJumpReleaseTime < this.jumpStartTime
      ) {
        // console.log("highjump");
        this.highJumpStarted = true;
        this.jumpEndTime = this.jumpStartTime + this.opts.timeToHighJumpApex;
      }

      // time since jump start
      const t = time - this.jumpStartTime;

      const blendDuration =
        this.opts.timeToJumpApex - this.opts.highJumpCheckTime;
      const b =
        1 -
        (1 -
          Math.max(
            0,
            Math.min(1, (t - this.opts.highJumpCheckTime) / blendDuration)
          )) **
          2;

      // represent jump as a parabola with x being the time in seconds and y the y-translation relative to the jumping off point
      const y0 =
        (1 - ((t - this.opts.timeToJumpApex) / this.opts.timeToJumpApex) ** 2) *
        this.opts.jumpAltitude;

      const y1 =
        (1 -
          ((t - this.opts.timeToHighJumpApex) / this.opts.timeToHighJumpApex) **
            2) *
        this.opts.highJumpAltitude;

      const y = this.highJumpStarted ? y1 * b + y0 * (1 - b) : y0;

      v.y = this.jumpStartPos.y + y - pos.y;

      if (this.directionalInput.lengthSq() > 0.001) {
        // if there's zero initial linear velocity, but a directional key is pressed,
        // retrofit initial velocity by shifting the start position
        if (this.jumpStartLinearVel.lengthSq() < 0.01) {
          this.jumpStartLinearVel.copy(this.directionalInput);
          this.jumpStartLinearVel.multiplyScalar(
            this.opts.jumpLateDirectionalCorrectionSpeed
          );

          this.jumpStartPos.x -= this.jumpStartLinearVel.x * t;
          this.jumpStartPos.z -= this.jumpStartLinearVel.z * t;
        }

        v2Temp0.set(this.jumpStartLinearVel.x, this.jumpStartLinearVel.z);
        const velocityMagnitude = v2Temp0.length();

        v2Temp1.set(this.directionalInput.x, this.directionalInput.z);

        const nextAngle = this.getNextAirControlAngle(
          v2Temp0.angle(),
          v2Temp1.angle(),
          v,
          deltaTime
        );

        v2Temp1.set(Math.cos(nextAngle), Math.sin(nextAngle));
        v2Temp0.copy(v2Temp1);

        // rotate initial velocity to match new direction
        v2Temp0.multiplyScalar(velocityMagnitude);

        this.jumpStartLinearVel.set(
          v2Temp0.x,
          this.jumpStartLinearVel.y,
          v2Temp0.y
        );

        // rotate start pos around the player to match new direction

        v2Temp1.negate();
        v2Temp0.set(this.jumpStartPos.x - pos.x, this.jumpStartPos.z - pos.z);
        v2Temp1.multiplyScalar(v2Temp0.length());

        this.jumpStartPos.set(
          v2Temp1.x + pos.x,
          this.jumpStartPos.y,
          v2Temp1.y + pos.z
        );
      }

      // assume that xz velocity components remain constant thru the jump
      v.x = this.jumpStartPos.x + this.jumpStartLinearVel.x * t - pos.x;
      v.z = this.jumpStartPos.z + this.jumpStartLinearVel.z * t - pos.z;
    } else {
      // step simulation forwards

      if (this.isGrounded) {
        // walking impulse
        const i =
          this.opts.maxAcceleration *
          Math.min(
            this.opts.groundTractionScale * this.effectiveFrictionCoefficient,
            1
          ) *
          deltaTime;
        v.z += this.directionalInput.z * i;
        v.x += this.directionalInput.x * i;

        v.clampLength(0, this.maxSpeed * desiredSpeed);

        // reduce ground friction to zero if...
        const frictionContribution =
          1 -
          Math.min(
            // directional input is engaged more than 25% and ...
            this.directionalInput.length() * 4,
            // we're over 25% of our walk speed
            (v.length() / this.opts.walkSpeed) * 4,
            1
          );

        // ground friction impulse
        const xAbs = Math.abs(v.x);
        const zAbs = Math.abs(v.z);
        const j =
          this.opts.groundFrictionScale *
          this.effectiveFrictionCoefficient *
          deltaTime *
          frictionContribution;
        v.x -= Math.min(xAbs, xAbs * j) * Math.sign(v.x);
        v.z -= Math.min(zAbs, zAbs * j) * Math.sign(v.z);
      } else {
        // free fall

        if (this.directionalInput.lengthSq() > 0.001) {
          v2Temp0.set(v.x, v.z);
          v2Temp1.set(this.directionalInput.x, this.directionalInput.z);
          const nextAngle = this.getNextAirControlAngle(
            v2Temp0.angle(),
            v2Temp1.angle(),
            v,
            deltaTime
          );

          v2Temp1.set(Math.cos(nextAngle), Math.sin(nextAngle));
          v2Temp1.multiplyScalar(v2Temp0.length());

          v.x = v2Temp1.x;
          v.z = v2Temp1.y;
        }
      }

      v.y -= this.g * deltaTime;

      // null velocity components under 3cm/s
      if (Math.abs(v.x) < 0.03) v.x = 0;
      if (Math.abs(v.y) < 0.03) v.y = 0;
      if (Math.abs(v.z) < 0.03) v.z = 0;

      v.x *= deltaTime;
      v.y *= deltaTime;
      v.z *= deltaTime;
    }

    this.charController.computeColliderMovement(
      this.collider,
      v,
      null,
      null,
      // filter out all colliders.
      // This should really be done by setting the QueryFilterFlags.EXCLUDE_SENSORS filter flag,
      // which is currently bugged, hence the filter predicate.
      (collider) => !collider.isSensor()
    );

    const wasGrounded = this.isGrounded;
    this.isGrounded = this.charController.computedGrounded();

    if (wasGrounded && !this.isGrounded) {
      this.lastGroundLeave = time;
    } else if (!wasGrounded && this.isGrounded) {
      this.lastGroundEnter = time;
    }

    // TODO: make more percise
    if (this.charController.numComputedCollisions() > 0) {
      this.isJumping = false;
    }

    this.effectiveFrictionCoefficient = 0;
    this.isPushingWall = false;
    for (let i = 0; i < this.charController.numComputedCollisions(); i += 1) {
      // This is a very crude approximation:
      // We're grabbing the highest friction coeff of ANY scene geometry
      // and apply it to ALL horizontal movement
      const collision = this.charController.computedCollision(i);
      this.effectiveFrictionCoefficient = Math.max(
        this.effectiveFrictionCoefficient,
        collision.collider.friction()
      );

      v3Temp.copy(v);
      v3Temp.setY(0);
      v3Temp.normalize();
      v3Temp.negate();

      if (v3Temp.dot(collision.normal1 as Vector3) > 0.1) {
        v3Temp.copy(collision.normal1 as Vector3);

        if (v3Temp.dot(up) < 0) {
          this.isPushingWall = true;
          this.wallNormal.copy(collision.normal1 as Vector3);
        }
      }

      // forward collision events
      this._updateCollisionState(
        collision.collider,
        this.internalCollider,
        collision
      );
    }

    // manually find sensor intersections to work around rapier bug
    this.physics.world.intersectionsWithShape(
      this.collider.translation(),
      this.collider.rotation(),
      this.collider.shape,
      (handle) => {
        this._updateIntersectionState(handle, this.internalCollider);
        return true;
      },
      null,
      null,
      null,
      null,
      (collider) => collider.isSensor()
    );

    // samsy

    // collider.parent.quaternion = object.quaternion;

    const movement = this.charController.computedMovement();

    // debugger;
    this.colliderRb.setNextKinematicTranslation({
      x: movement.x + pos.x,
      y: movement.y + pos.y,
      z: movement.z + pos.z,
    });

    // this.internalCollider.parent.position = {
    //     x: movement.x + pos.x,
    //     y: movement.y + pos.y,
    //     z: movement.z + pos.z,
    // }

    if (
      this.internalCollider.parent.quaternion.equals(this.object.quaternion) ==
      false
    ) {
      this.internalCollider.parent.quaternion = this.object.quaternion;
    }

    //

    // if (isNaN(v.x)) {
    //     console.error("NaN velocity", JSON.stringify(v), v.x, v.y, v.z);
    // }

    // calculate difference between desired and computed movement to extract
    // velocity changes due to corrections (snap to ground, autostep, collisions etc.)
    this.correctionVelocityContribution.set(
      (movement.x - v.x) / deltaTime,
      (movement.y - v.y) / deltaTime,
      (movement.z - v.z) / deltaTime
    );
  };

  _prevPos = new Vector3();
  _currentPos = new Vector3();

  private updateVisuals = (deltaTime: number, time: number) => {
    this._prevPos.copy(this._currentPos);
    const pos = this.colliderRb.translation();
    v.copy(this.object.position);

    const y = v.z - pos.z;
    const x = v.x - pos.x;

    const isMoving =
      Math.abs(y) + Math.abs(x) > this.opts.walkSpeed / 100000 / deltaTime &&
      this.directionalInput.length() > 0.01 &&
      !this.isPushingWall;

    if (isMoving) {
      quatTemp.setFromAxisAngle(up, -Math.atan2(y, x) + Math.PI / 2);
    } else {
      quatTemp.copy((this.object as Object3D).quaternion);
    }

    (this.object as Object3D).position.set(pos.x, pos.y, pos.z);
    this._currentPos.copy(this.object.position);
    (this.object as Object3D).quaternion.slerp(
      quatTemp,
      Math.min(1, deltaTime / this.opts.orientationSmoothing)
    );

    if (!this.opts.autoAnimate) return;

    let nextAnimation = "fly";

    if (this.isJumping) {
      nextAnimation = "jump";
    } else if (this.isGrounded) {
      const anim = this.isSprinting ? "run" : "walk";

      nextAnimation = isMoving ? anim : "idle";
    }
    if (this.isPushingWall) nextAnimation = "idle";

    this.lastAnimations[time] = nextAnimation;

    // only animate if there has been no change in animation in the last 40ms
    let shouldAnimate = true;

    Object.keys(this.lastAnimations).forEach((key) => {
      const animTime = parseFloat(key);

      if (time - animTime > 0.04) {
        delete this.lastAnimations[key];
      } else {
        shouldAnimate =
          shouldAnimate && nextAnimation == this.lastAnimations[key];
      }
    });

    if (shouldAnimate && this.object.animation != nextAnimation) {
      this.object.animation = nextAnimation;
    }
  };

  private interpolate = (alpha: number) => {
    //
    this.object.position.copy(this._prevPos);

    this.object.position.lerp(this._currentPos, alpha);
  };

  /**
   * Whether the user is applying some directional input (WASD or joystick)
   */
  public get isMoving() {
    return this.directionalInput.lengthSq() > 0;
  }

  /**
   * The characters linear velocity. This does not include velocity changes from corrections (e.g. auto step, snap to ground)
   */
  public get velocity() {
    return this.publicVelocity;
  }

  public dispose() {
    super.dispose();

    this.charController.free();
    this.removeEvents();
  }

  private _updateCollisionState(
    collider: Collider,
    playerCollider: InternalCollider,
    collision: CharacterCollision
  ) {
    // @ts-ignore
    const cyberCollider = InternalCollider.getFromRaw(collider);

    if (playerCollider._activeEvents.collision) {
      playerCollider._onCollisionChange(
        cyberCollider,
        new CharacterCollisionEvent(
          false,
          playerCollider.component,
          cyberCollider.component,
          collision,
          0 // will be set later
        )
      );
    }

    if (cyberCollider._activeEvents.collision) {
      cyberCollider._onCollisionChange(
        playerCollider,
        new CharacterCollisionEvent(
          true,
          cyberCollider.component,
          playerCollider.component,
          collision,
          0 // will be set later
        )
      );
    }
  }

  private _updateIntersectionState(
    collider: Collider,
    playerCollider: InternalCollider
  ) {
    // @ts-ignore
    const cyberCollider = InternalCollider.getFromRaw(collider);

    if (playerCollider._activeEvents.sensor) {
      playerCollider._onCollisionChange(
        cyberCollider,
        new IntersectionEvent(
          playerCollider.component,
          cyberCollider.component,
          0 // will be set later
        )
      );
    }

    if (cyberCollider._activeEvents.sensor) {
      cyberCollider._onCollisionChange(
        playerCollider,
        new IntersectionEvent(
          cyberCollider.component,
          playerCollider.component,
          0 // will be set later
        )
      );
    }
  }

  private _showJoystick: boolean = false;

  private _showJumpButton: boolean = false;

  /**
   * Set to true to show the joystick. This is mainly for mobile devices where keyboard input is not available.
   */
  set showJoystick(value) {
    if (value === this._showJoystick) return;

    this._showJoystick = value;

    this.showJumpButton = value;

    if (__BUILD_TARGET__ !== "web") return;

    if (value) {
      const joystick = document.getElementById("phantom-joystick");

      if (joystick) {
        joystick.style.display = "block";
      }

      window.addEventListener("joystick", this.onJoystick, {
        capture: true,
      });
    } else {
      const joystick = document.getElementById("phantom-joystick");

      if (joystick) {
        joystick.style.display = "none";
      }

      window.removeEventListener("joystick", this.onJoystick, {
        capture: true,
      });
    }
  }

  set showJumpButton(value) {
    if (value === this._showJumpButton) return;

    this._showJumpButton = value;

    if (__BUILD_TARGET__ !== "web") return;

    if (value) {
      const jumpButton = document.getElementById("jump-button");

      if (jumpButton) {
        jumpButton.style.display = "flex";
      }

      jumpButton.addEventListener("touchstart", this.onJumpButtonDown);
      jumpButton.addEventListener("touchend", this.onJumpButtonUp);
      jumpButton.addEventListener("touchcancel", this.onJumpButtonUp);
    } else {
      const jumpButton = document.getElementById("jump-button");

      if (jumpButton) {
        jumpButton.style.display = "none";
      }

      jumpButton.removeEventListener("touchstart", this.onJumpButtonDown);
      jumpButton.removeEventListener("touchend", this.onJumpButtonUp);
      jumpButton.removeEventListener("touchcancel", this.onJumpButtonUp);
    }
  }

  /**
   * Returns true if the joystick is visible.
   */
  get showJoystick() {
    return this._showJoystick;
  }

  /**
   * Returns true if the jump button is visible.
   *
   */
  get showJumpButton() {
    return this._showJumpButton;
  }
}
