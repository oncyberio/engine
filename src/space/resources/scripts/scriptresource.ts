import type { ScriptResourceFactory } from ".";
import { Resource } from "../resource";
import { ScriptDelegate } from "./scriptdelegate";
import { ScriptResourceData } from "./scriptdata";

export interface ScriptModuleOpts {
    factory: ScriptResourceFactory;
    data: ScriptResourceData;
}

export class ScriptResource extends Resource<ScriptResourceData> {
    // Put module relevent code on another class so it's easier to swap

    _delegate: ScriptDelegate = null;

    private _factory: ScriptResourceFactory;

    private _exports: Record<string, any> = {};

    private _source: string;

    private _prevState = null;

    _prevParams = null;

    constructor(opts: ScriptModuleOpts) {
        //
        super({
            data: opts.data,
            factory: opts.factory,
        });

        this._factory = opts.factory;

        this._patch(opts);
    }

    _patch(opts: Omit<ScriptModuleOpts, "factory">) {
        //
        this._prevState =
            this._delegate != null
                ? {
                      source: this._source,
                      data: this._data,
                      delegate: this._delegate,
                      exports: { ...this._exports },
                      scriptType: this.scriptType,
                  }
                : null;

        this._data = opts.data;

        this._source = this.data.emit?.code || "";

        // TMP
        if (this._data.name === "server") {
            //
            this._source = "";
        }

        this._setExports({});

        this._delegate = new ScriptDelegate({
            factory: this._factory,
            data: this._data,
            source: this._source,
            exports: this._exports,
        });
    }

    private _validateTransition() {
        //
        if (this._prevState == null) return;

        const prevType = this._prevState.scriptType;

        const isValidTransition =
            validScriptTransitions[prevType]?.[this.scriptType];

        if (!isValidTransition && this.hasReferences()) {
            //
            throw new Error(
                `Can't change script type from ${prevType} to ${this.scriptType} while module has references`
            );
        }
    }

    runModule() {
        //
        try {
            this._evalOnce();

            this._validateTransition();

            if (this._prevState != null) {
                //
                this._prevParams = this._prevState.delegate._params;

                this._disposeDelegate(this._prevState.delegate);
            }

            this._state = { type: "loaded" };
            //
        } catch (err) {
            //
            this._state = { type: "error" };

            if (this._prevState != null) {
                //
                this._source = this._prevState.source;

                this._data = this._prevState.data;

                this._delegate = this._prevState.delegate;

                this._setExports(this._prevState.exports);
            }

            throw err;
            //
        } finally {
            //
            this._prevState = null;
        }
    }

    private _setExports(exports: Record<string, any>) {
        //
        Object.keys(this._exports).forEach((key) => {
            //
            delete this._exports[key];
        });

        Object.keys(exports).forEach((key) => {
            //
            this._exports[key] = exports[key];
        });
    }

    _evalOnce() {
        //
        let evaluated = this._delegate.evalOnce();

        if (!evaluated) return;

        this._data = {
            ...this._data,
            meta: this._delegate._meta ?? null,
        };

        if (this.scriptType === "component" || this.scriptType === "behavior") {
            //
            this.klass["$$module"] = this; // not sure why this get undefined, think we override this for some marketplace stuff
            this.klass["$$resource"] = this;
        }
    }

    get evaluated() {
        return this._delegate._evaluated;
    }

    get exports() {
        return this._delegate._exports;
    }

    get klass() {
        return this._delegate._exports.default;
    }

    get config() {
        //
        return this._delegate._config;
    }

    get scriptType() {
        //
        return this._delegate._scriptType;
    }

    get isComponent() {
        //
        return this._delegate._isComponent;
    }

    get isMain() {
        //
        return this._delegate._isMain;
    }

    get isBehavior() {
        //
        return this.scriptType === "behavior";
    }

    get isLib() {
        //
        return this.scriptType === "lib";
    }

    get hasComponentFactory() {
        //
        return this.isComponent;
    }

    get meta() {
        //
        return this._delegate._meta;
    }

    private get _dependencies() {
        //
        return this._delegate._dependencies;
    }

    getDefaultComponentData() {
        //
        if (!this.isComponent) {
            //
            throw new Error("Not a component");
        }

        return {
            type: this.data.id,
            name: this._delegate._meta.title,
            ...this._delegate._paramsData,
        };
    }

    get _params() {
        //
        return this._delegate._params;
    }

    getValuePaths() {
        //
        return this._delegate._valuePaths;
    }

    dependsOn(resource: Resource, visited = {}) {
        //
        if (visited[this.data.uri]) return false;

        let data = resource.data as any;

        // scripts only depend on other scripts
        if (data.type !== "script") return false;

        // direct import
        if (this._dependencies[data.uri]) return true;

        visited[this.data.uri] = true;

        // indirect import
        return Object.keys(this._dependencies).some((uri) => {
            //
            let script = this._factory.getModuleByUri(uri);

            if (script == null) return false;

            return script.dependsOn(resource, visited);
        });
    }

    getPrefabs() {
        //
        if (!this.isComponent) return [];

        return this.space.resources.prefabs.filter(
            (p) => p.data.template.type === this.data.id
        );
    }

    protected _disposeDelegate(delegate: ScriptDelegate) {
        //
        if (
            delegate._scriptType === "component" ||
            delegate._scriptType === "behavior"
        ) {
            //
            delete delegate._exports.default["$$module"];
        }

        delegate.dispose();
    }

    dispose() {
        //
        //
        this._disposeDelegate(this._delegate);

        this._delegate = null;
    }
}

const validScriptTransitions = {
    lib: { lib: true, behavior: true, component: true },
    behavior: { behavior: true, component: true },
    component: { component: true },
};
