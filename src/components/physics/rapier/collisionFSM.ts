import { BaseIntersectionEvent } from "./constants";

const COLLISION_STATES = {
  Idle: 0,
  Enter: 1,
  Stay: 2,
  Exit: 3,
} as const;

type IdleState = { type: 0; collision: null };

type EnterState = { type: 1; collision: BaseIntersectionEvent };

type StayState = { type: 2; collision: BaseIntersectionEvent };

type ExitState = { type: 3; collision: BaseIntersectionEvent };

export type CollisionFSMState = IdleState | EnterState | StayState | ExitState;

/**
 * A finite state machine for collision events.
 *
 * Each frame, the appropriate collision events are emitted (enter, exit, stay). Based on the change of the state of the collision.
 */
export class CollisionFSM {
  //
  readonly STATES = COLLISION_STATES;

  private _state: CollisionFSMState = {
    type: COLLISION_STATES.Idle,
    collision: null,
  };

  currentCollision: BaseIntersectionEvent | null = null;

  get state() {
    return this._state;
  }

  update(frame: number) {
    //
    let collision = this.currentCollision;

    this.currentCollision = null;

    if (collision) {
      collision.frame = frame;
    }

    switch (this._state.type) {
      //
      case COLLISION_STATES.Idle:
        if (collision != null) {
          // @ts-ignore
          this._state.type = COLLISION_STATES.Enter;
          // @ts-ignore
          this._state.collision = collision;
        }
        break;

      case COLLISION_STATES.Enter:
        if (collision != null) {
          // @ts-ignore
          this._state.type = COLLISION_STATES.Stay;
          // @ts-ignore
          this._state.collision = collision;
        } else {
          // @ts-ignore
          this._state.type = COLLISION_STATES.Exit;
        }
        break;
      case COLLISION_STATES.Stay:
        if (collision != null) {
          // @ts-ignore
          this._state.type = COLLISION_STATES.Stay;
          // @ts-ignore
          this._state.collision = collision;
        } else {
          // @ts-ignore
          this._state.type = COLLISION_STATES.Exit;
        }
        break;
      case COLLISION_STATES.Exit:
        if (collision != null) {
          // @ts-ignore
          this._state.type = COLLISION_STATES.Enter;
          // @ts-ignore
          this._state.collision = collision;
        } else {
          // @ts-ignore
          this._state.type = COLLISION_STATES.Idle;
          // @ts-ignore
          this._state.collision = null;
        }
        break;
    }

    return this._state;
  }
}
