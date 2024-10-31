import Augmented from "engine/abstract/augmented";

type Callback = () => void;

const STORE_STATE_EVENT = "STORE_STATE_EVENT";

export class Store<State> extends Augmented {
    //
    constructor(private _state: State) {
        //
        super();
    }

    public getState = () => this._state;

    public subscribe = (cb: Callback) => {
        //
        this.on(STORE_STATE_EVENT, cb);

        return () => {
            //
            this.off(STORE_STATE_EVENT, cb);
        };
    };

    public notify = () => {
        //
        this.emit(STORE_STATE_EVENT);
    };

    public update = (newState: Partial<State>) => {
        //
        this._state = {
            ...this._state,
            ...newState,
        };

        this.notify();
    };
}
