import AugmentedGroup from "engine/abstract/augmentedgroup";

import Emitter from "engine/events/emitter";

import Events from "engine/events/events";

import { ScriptEvents } from "./scriptevents";
import { deferred } from "engine/utils/deferred";

type GameState =
    | "GAME_PRELOAD"
    | "GAME_INIT"
    | "GAME_READY"
    | "GAME_START"
    | "GAME_UPDATE"
    | "GAME_END"
    | "GAME_DISPOSE"
    // pause called from withing the game
    | "GAME_PAUSE"
    // pause called from outside the game
    | "GAME_NOTIFY_PAUSE"
    | "GAME_NOTIFY_RESUME"
    // always called by the script
    | "GAME_RESUME";

/*
const transitions = {
    GAME_INIT: ["GAME_READY", "GAME_DISPOSE"],

    GAME_READY: ["GAME_START", "GAME_DISPOSE"],

    GAME_START: ["GAME_UPDATE", "GAME_DISPOSE"],

    GAME_UPDATE: ["GAME_UPDATE", "GAME_PAUSE", "GAME_DISPOSE"],

    GAME_PAUSE: ["GAME_RESUME", "GAME_DISPOSE"],

    GAME_RESUME: ["GAME_UPDATE", "GAME_PAUSE", "GAME_DISPOSE"],

    GAME_DISPOSE: [],
};

function ensureValidTransition(from: GameState, to: GameState) {
    if (transitions[from].includes(to)) return;

    throw new Error(`Invalid transition from ${from} to ${to}`);
}
*/

type Task = () => Promise<any>;

export class ScriptEmitter {
    //
    private _deferredReady = deferred();

    #internalEmitter = new AugmentedGroup();

    _state: GameState = "GAME_PRELOAD";

    #isGameLoop = false;

    #isGameReady = false;

    private _readyTasks = [];

    private _readyTasksFlushed = false;

    /**
     * @internal
     */
    _addReadyTask(task: Task) {
        //
        if (this._readyTasksFlushed) {
            //
            task();

            return () => {};
        }

        this._readyTasks.push(task);

        return () => {
            //
            this._readyTasks = this._readyTasks.filter((t) => t !== task);
        };
    }

    /**
     * @internal
     */
    async _flushReadyTasks() {
        //
        this._readyTasksFlushed = true;

        console.log("Emitter, Flushing ready tasks");

        await Promise.all(this._readyTasks.map((task) => task()));

        console.log("Emitter, All ready tasks done");

        Emitter.emit(Events.GAME_POST_READY, {});
    }

    constructor() {
        globalThis["$scriptEmitter"] = this;
    }

    get gameReady() {
        return this._deferredReady.promise;
    }

    on(event, handler) {
        this.#internalEmitter.on(event, handler);
    }

    off(event, handler) {
        this.#internalEmitter.off(event, handler);
    }

    once(event, handler) {
        this.#internalEmitter.once(event, handler);
    }

    #lifecycles = {
        [Events.GAME_SPACE_LOADED]: (payload) => {
            // console.log("LIFECYCLE", Events.GAME_SPACE_LOADED, this._state);
            if (this._state !== "GAME_PRELOAD") return;

            this._state = "GAME_INIT";

            this.#internalEmitter.emit("GAME_SPACE_LOADED", payload);

            this.#isGameReady = false;

            this.#isGameLoop = false;
        },
        [Events.GAME_READY]: (payload) => {
            // console.log("LIFECYCLE", Events.GAME_READY, this._state);
            if (this._state !== "GAME_INIT") return;

            this._state = "GAME_READY";

            this.#internalEmitter.emit("GAME_READY", payload);

            this._deferredReady.resolve(null);

            this.#isGameReady = true;

            this.#isGameLoop = false;

            this._flushReadyTasks();
        },

        [Events.GAME_START]: (payload) => {
            if (!this.#isGameReady) return;

            this._state = "GAME_START";

            this.#internalEmitter.emit("GAME_START", payload);

            this.#isGameLoop = true;
        },
        [Events.GAME_END]: (payload) => {
            if (this._state !== "GAME_UPDATE") return;

            this._state = "GAME_END";

            this.#internalEmitter.emit("GAME_END", payload);

            this.#isGameLoop = false;
        },

        // internal
        [Events.GAME_PAUSE]: (payload) => {
            if (this._state !== "GAME_UPDATE") return;

            this._state = "GAME_PAUSE";

            this.#internalEmitter.emit("GAME_PAUSE", payload);

            this.#isGameLoop = false;
        },

        [Events.GAME_RESUME]: (payload) => {
            if (
                this._state !== "GAME_PAUSE" &&
                this._state !== "GAME_NOTIFY_RESUME"
            )
                return;

            this._state = "GAME_UPDATE";

            this.#internalEmitter.emit("GAME_RESUME", payload);

            this.#isGameLoop = true;
        },

        // external
        [Events.GAME_NOTIFY_PAUSE]: (payload) => {
            if (this._state !== "GAME_UPDATE") return;

            this._state = "GAME_NOTIFY_PAUSE";

            this.#internalEmitter.emit("GAME_NOTIFY_PAUSE", payload);

            this.#isGameLoop = false;
        },

        [Events.GAME_NOTIFY_RESUME]: (payload) => {
            if (this._state !== "GAME_NOTIFY_PAUSE") return;

            this._state = "GAME_NOTIFY_RESUME";

            this.#internalEmitter.emit("GAME_NOTIFY_RESUME", payload);

            this.#isGameLoop = false;
        },

        [Events.GAME_DISPOSE]: (payload) => {
            this._state = "GAME_DISPOSE";

            this.#internalEmitter.emit("GAME_DISPOSE", payload);

            this.#isGameLoop = false;
        },
    };

    #onFixedUpdate = (dt, abs) => {
        if (!this.#isGameLoop) return;

        this._state = "GAME_UPDATE";

        this.#internalEmitter.emit("GAME_FIXED_UPDATE", dt, abs);
    };

    #onAfterFixedIpdate = (dt, abs) => {
        if (!this.#isGameLoop) return;

        this._state = "GAME_UPDATE";

        this.#internalEmitter.emit("GAME_AFTER_FIXED_UPDATE", dt, abs);
    };

    #onFixedInterpolate = (dt, abs) => {
        if (!this.#isGameLoop) return;

        this._state = "GAME_UPDATE";

        this.#internalEmitter.emit("GAME_FIXED_INTERPOLATE", dt, abs);
    };

    #onPreUpdate = (dt) => {
        this.#internalEmitter.emit("GAME_FRAME", dt);

        if (!this.#isGameLoop) return;

        this._state = "GAME_UPDATE";

        this.#internalEmitter.emit("GAME_UPDATE", dt);
    };

    #onDawnUpdate = (dt) => {
        if (!this.#isGameLoop) return;

        this._state = "GAME_UPDATE";

        this.#internalEmitter.emit("GAME_DAWN_UPDATE", dt);
    };

    #emit = (event, arg) => {
        if (this.#lifecycles[event] != null) {
            this.#lifecycles[event](arg);
        } else {
            this.#internalEmitter.emit(event, arg);
        }
    };

    #subs = [];

    #subsribe = (event, handler) => {
        this.#subs.push(() => Emitter.off(event, handler));

        Emitter.on(event, handler);
    };

    #addEvents() {
        console.log(ScriptEvents);
        Object.values(ScriptEvents).forEach((event) => {
            this.#subsribe(event, (arg) => {
                this.#emit(event, arg);
            });
        });

        this.#subsribe(Events.PRE_UPDATE, this.#onPreUpdate);

        this.#subsribe(Events.DAWN_UPDATE, this.#onDawnUpdate);

        // Uncomment this when we want fixed update events available for scripts

        this.#subsribe(Events.FIXED_UPDATE, this.#onFixedUpdate);

        this.#subsribe(Events.AFTER_FIXED_UPDATE, this.#onAfterFixedIpdate);

        this.#subsribe(Events.FIXED_INTERPOLATE, this.#onFixedInterpolate);
    }

    #removeEvents() {
        this.#subs.forEach((unsub) => {
            unsub();
        });
    }

    /**
     * @internal
     */
    init() {
        this.#addEvents();
    }

    /**
     * @internal
     */
    dispose() {
        this.#removeEvents();
    }

    emit(event, arg) {
        if (
            this.#lifecycles[event] != null ||
            Events[event] != null ||
            ScriptEvents[event] != null
        ) {
            // bailout
        } else {
            this.#internalEmitter.emit(event, arg);
        }
    }
}
