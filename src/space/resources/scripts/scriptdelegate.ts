import type { ScriptResourceFactory } from ".";
import { ScriptRunner } from "./scriptrunner";
import {
    InternalConfig,
    ScriptBehavior,
    ScriptComponent,
} from "./api/scriptparams";
import { ComponentInfo } from "engine/abstract/componentinfo";
import { ScriptResourceData } from "./scriptdata";
import { Param, ParamsParser } from "engine/space/params";

const mainRegex = /(\.\/)?main(\.js|ts|jsx|tsx)?/;

const USE_SERVER_REGEX = /^\s*"use server"/;

export class ScriptDelegate {
    //
    _scriptRunner: ScriptRunner = null;

    _evaluated = false;

    _factory: ScriptResourceFactory;

    _scriptType: "component" | "behavior" | "lib" = null;

    _isComponent = false;

    _config: InternalConfig = null;

    _defaultMeta: any = null;

    _meta: ComponentInfo = null;

    _paramsData: any = null;

    _params: any[] = null;

    _valuePaths: string[] = null;

    _dependencies: Record<string, any> = {};

    _exports: any;

    _isMain = false;

    private _require = (uri: string) => {
        //
        let imp = this._factory.require(uri);

        this._dependencies[uri] = true;

        return imp;
    };

    constructor(
        public opts: {
            factory: ScriptResourceFactory;
            data: ScriptResourceData;
            source: string;
            exports: object;
        }
    ) {
        //

        this._factory = opts.factory;

        this._exports = opts.exports;

        this._scriptRunner = new ScriptRunner({
            code: opts.source,
            env: {
                require: this._require,
                exports: this._exports,
            },
        });

        this._defaultMeta = {
            type: opts.data.id,
            title: opts.data.name,
        };

        this._isMain = mainRegex.test(opts.data.uri);
    }

    evalOnce() {
        //
        if (this._evaluated) return false;

        this._evaluated = true;

        // console.log("evaluating script " + this.opts.data.uri);

        this._scriptRunner.run();

        this._getConfig();

        return true;
    }

    private _getConfig() {
        //
        let klass = this._exports.default;

        this._config = klass?.prototype?.$$config ?? null;

        const isScriptComponent = ScriptComponent.prototype.isPrototypeOf(
            klass?.prototype
        );

        if (isScriptComponent) {
            //

            const isScriptBehavior = ScriptBehavior.prototype.isPrototypeOf(
                klass?.prototype
            );

            this._config = {
                batchDraw: false,
                ...this._config,
                ...(klass.config ?? {}),
                scriptType: isScriptBehavior ? "behavior" : "component",
            };
        }

        if (
            this._config == null &&
            this._isMain &&
            klass != null &&
            !isScriptComponent
        ) {
            //
            this._config = {
                scriptType: "component",
                title: "main",
                singleton: true,
            };
        }

        let instance: any;

        if (this._config != null && klass) {
            try {
                instance = new klass();
                //
            } catch (e) {
                //
                klass = null;

                this._config = null;

                console.error(e);
            }
        }

        this._isComponent = this._config != null;

        if (!this._isComponent) {
            //
            this._scriptType = "lib";
            //
        } else if (this._config.scriptType === "behavior") {
            //
            this._scriptType = "behavior";

            delete this._config.draggable;
            delete this._config.singleton;
            delete this._config.batchDraw;
            //
        } else {
            //
            this._scriptType = "component";
        }

        this._defaultMeta.title = klass?.name ?? this.opts.data.name;

        if (this._config == null) return;

        const { transform, ...meta } = this._config;

        this._meta = {
            ...this._defaultMeta,
            draggable: transform && (transform === true || transform.position),
            transform,
            ...meta,
            server: meta.server ?? USE_SERVER_REGEX.test(this.opts.source),
        };

        if (this._isComponent) {
            //
            instance.info = this._meta;

            const config = ParamsParser.getConfig(instance);

            this._paramsData = config?.data ?? {};

            this._params = config?.params ?? [];

            this._valuePaths = config?.valuePaths ?? [];

            let customData = klass.onGetInstanceData?.() ?? {};

            this._paramsData = {
                ...this._paramsData,
                ...customData,
            };

            if (customData) {
                this._valuePaths = this._valuePaths.concat(
                    Object.keys(customData)
                );
            }

            if (
                typeof globalThis.$$registerEntity === "function" &&
                config.netState
            ) {
                // console.log("registering net state", this.opts.data.id);
                let schema = config.netState.getSchema();

                if (schema != undefined) {
                    //
                    globalThis.$$registerEntity(this.opts.data.id, schema);
                }
            }

            if (config.netState || Object.keys(config.rpcMethods).length) {
                this._meta.server = true;
            }
        }
    }

    getValuePaths() {
        //
        return this._valuePaths;
    }

    dispose() {
        //
        //
        this._factory = null;

        this._dependencies = null;

        this._exports = null;
    }
}
