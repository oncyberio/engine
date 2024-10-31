import { ScriptEmitter } from "./scriptemitter";

import { ScriptEvents } from "./scriptevents";

export class GameTimer {
    private _gameTime = 0;

    constructor(private emitter: ScriptEmitter) {
        this.emitter.on(ScriptEvents.GAME_UPDATE, this.onGameUpdate);
    }

    onGameUpdate = (delta: number) => {
        this._gameTime += delta;
    };

    get elapsedTime() {
        //
        return this._gameTime;
    }
}
