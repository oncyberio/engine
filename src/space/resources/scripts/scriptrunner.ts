const STATES = {
    IDLE: "IDLE",
    EVALED: "EVALED",
    ERROR: "ERROR",
} as const;

export type ScriptState = keyof typeof STATES;

export interface ScriptWrapperOpts {
    code: string;
    env: Record<string, unknown>;
}

export class ScriptRunner {
    //
    state: ScriptState = STATES.IDLE;

    error: string = null;

    private _moduleFunc: Function;

    private _runFunc: (env: Record<string, unknown>) => unknown;

    constructor(public opts: ScriptWrapperOpts) {
        //
        this.opts = opts;

        this._eval();
    }

    private _eval() {
        //
        if (this.state !== STATES.IDLE) {
            throw new Error("eval: invalid state " + this.state);
        }

        try {
            const envKeys = Object.keys(this.opts.env);

            this._moduleFunc = new Function(...envKeys, this.opts.code);

            const defEnv = this.opts.env;

            this._runFunc = (env = {}) => {
                //
                const envValues = envKeys.map((key) => {
                    //
                    const val = env[key] ?? defEnv[key];

                    if (val === undefined) {
                        throw new Error(
                            `ScriptWrapper: env.${key} is undefined`
                        );
                    }

                    return val;
                });

                return this._moduleFunc.call(null, ...envValues);
            };

            this.state = STATES.EVALED;
            //
        } catch (err) {
            //
            console.error(err);

            this.state = STATES.ERROR;

            this.error = err.message;

            throw new Error(err.message);
        }
    }

    run(env: Record<string, unknown> = {}) {
        //
        if (this.state !== STATES.EVALED) {
            //
            throw new Error("run: invalid state " + this.state);
        }

        return this._runFunc(env);
    }
}
