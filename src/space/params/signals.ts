export interface Callback<T> {
    (value: T): void;
}

export class SignalEmitter<T> {
    //
    private _listeners = new Set<(value: T) => void>();

    emit(value: T) {
        //
        this._listeners.forEach((listener) => listener(value));
    }

    connect(callback: Callback<T>) {
        //
        this._listeners.add(callback);

        return () => this.disconnect(callback);
    }

    disconnect(callback: Callback<T>) {
        //
        this._listeners.delete(callback);
    }

    hasListener(callback: Callback<T>) {
        //
        return this._listeners.has(callback);
    }

    nbListeners() {
        //
        return this._listeners.size;
    }

    dispose() {
        //
        this._listeners.clear();
    }
}

export class Action<T> {
    //
    private _disposers = new Map<SignalEmitter<T>, () => void>();

    constructor(private _callback: Callback<T>) {}

    connectTo(signal: SignalEmitter<T>) {
        //
        if (this.isConnectedTo(signal)) return;

        const dispose = signal.connect(this._callback);

        this._disposers.set(signal, dispose);
    }

    disconnectFrom(signal: SignalEmitter<T>) {
        //
        let dispose = this._disposers.get(signal);

        if (dispose) {
            dispose();
            this._disposers.delete(signal);
        }
    }

    isConnectedTo(signal: SignalEmitter<T>) {
        //
        return this._disposers.has(signal);
    }

    dispose() {
        //
        this._disposers.forEach((dispose) => dispose());

        this._disposers.clear();
    }
}
