import { Component3D } from "engine/scripting";
import { ComponentTypeMap } from "../components/components";
import { Vector2, Vector3 } from "three";
import { SignalEmitter, Action, Callback } from "./signals";
import { IS_SERVER_MODE } from "engine/constants";

interface XY {
    x: number;
    y: number;
}

interface XYZ {
    x: number;
    y: number;
    z: number;
}

export type Getter<T> = (() => T) | T;

interface Format {
    format: (value: any) => any;
    parse: (value: any) => any;
}

export interface FolderData {
    label: string;
    start?: boolean;
    end?: boolean;
    single?: boolean;
}

export interface AbstractParam<T = any> {
    name?: string;
    label?: string;
    info?: string;
    dataKey?: string;
    visible?: string | ((self: any) => boolean);
    bindable?: boolean;
    format?: Format;
    group?: FolderData;
    skipLabel?: boolean;
    useFolder?: FolderData;
    defaultValue?: T;
}
export interface StringParam extends AbstractParam<string> {
    type?: "string" | "text";
    isSecret?: boolean;
}

export interface NumberParam extends AbstractParam<number> {
    type?: "number";
    min?: number;
    max?: number;
    step?: number;
}

export interface BooleanParam extends AbstractParam<boolean> {
    type?: "boolean" | "checkbox";
}

export interface ColorParam extends AbstractParam<string> {
    type?: "color";
}

export interface AnimationParam extends AbstractParam<string> {
    type?: "animation";
}

export interface Vec2Param extends AbstractParam<XY> {
    type?: "vec2";
}

export interface Vec3Param extends AbstractParam<XYZ> {
    type?: "vec3" | "xyz";
}

type OptId = string | number;

type Opt<T extends OptId> = T | { id: T; label?: string };

type Options<T extends OptId> = Getter<Opt<T>[]>;

export interface SelectParam<T extends OptId = string>
    extends AbstractParam<T> {
    type?: "select";
    options?: Options<T>;
    mode?: "buttons" | "slider" | "dropdown";
}

/**
 * Group Params need to be initialized
 * @example @Param({ type: "group" }) myGroup = new MyGroup();
 */
export interface GroupParam<T = any> extends AbstractParam<T> {
    type?: "group";
    children?: { key: string; param: ScriptParam }[];
    factory?: new () => T;
}

/**
 * Resource Params need to be initialized using $Param.Resource
 * @example @Param() myAudio = $Param.Resource("audio")
 */
export interface ResourceParam extends AbstractParam {
    type?: "resource";
    required?: boolean;
    typeof?: string | any;
}

/**
 * Component Params need to be initialized using the $Param.Component
 * @example @Param() myAudio = $Param.Component("audio")
 * @example @Param() myComponent = $Param.Component(MyCustomComponent)
 * @example @Param() myComponent = $Param.Component("any")
 */

export interface ComponentParam extends AbstractParam {
    type?: "component";
    required?: boolean;
    typeof?: string | any;
}

export interface SignalParam extends AbstractParam {
    type?: "signal";
    event?: string;
    emitType?: ScriptParam;
}

export interface ArrayParam<T = any> extends AbstractParam<Array<T>> {
    type?: "array";
    itemParam?: AbstractParam;
    readonly?: boolean;
}

export interface Tagged<V> {
    readonly tag: string;
    readonly value: V;
}

export interface UnionParam extends AbstractParam {
    type?: "union";
    options?: Array<{ tag: string; value: ScriptParam }>;
    tagLabels?: Record<string, string>;
    mode?: "buttons" | "slider" | "dropdown";
}

export interface MapParam extends AbstractParam {
    type?: "map";
    itemParam?: AbstractParam;
    readonly?: boolean;
}

export interface TriggerParam extends AbstractParam {
    type?: "button";
    methodKey?: string;
    action?: () => void;
}

export interface ReceiverParam extends AbstractParam {
    type?: "receiver";
    methodKey?: string;
    callback?: () => void;
    argType?: ScriptParam;
}

export type ScriptParam =
    | StringParam
    | NumberParam
    | BooleanParam
    | ColorParam
    | AnimationParam
    | Vec2Param
    | Vec3Param
    | SelectParam
    | TriggerParam
    | ResourceParam
    | ComponentParam
    | SignalParam
    | ReceiverParam
    | GroupParam
    | ArrayParam
    | UnionParam
    | MapParam;

export interface TriggerOptions extends AbstractParam {}
export interface ReceiverOptions extends AbstractParam {
    emitType?: ScriptParam;
}
export interface SignalOptions extends AbstractParam {
    emitType?: ScriptParam;
}

export interface PresetOptions {
    image: string;
    name: string;
    data: any;
}

export type ParamOptions = ScriptParam;

export const PARAM_KEY = Symbol("@oncyber/params");

export const RPC_KEY = Symbol("@oncyber/rpc");

export const IS_PARAM_VAL = Symbol("@oncyber/isparam");

export interface ParamDecl {
    key: string;
    options: ScriptParam;
}

function applyParam(target: any, key: string, options: any = {}) {
    //
    let params = (target[PARAM_KEY] ??= []);

    let param = params.find((p) => p.key === key);

    if (!param) {
        //
        param = { key, options };

        params.push(param);
    } else {
        //
        let curOpts = param.options;

        param.options = {
            ...curOpts,
            ...options,
        };

        if (curOpts.group && options.group) {
            param.options.group = {
                ...curOpts.group,
                ...options.group,
            };
        }
    }
}

/**
 * Use this decorator to group multiple params into one folder
 */
export function Folder(label: string, opts?: any) {
    //
    return (target, key) => {
        //
        return applyParam(target, key, { group: { label, ...opts } });
    };
}

export interface Folder {
    Up: () => any;
    Down: () => any;
}

Folder.Down = () => {
    //
    return (target, key) => {
        //
        return applyParam(target, key, {
            group: { start: true },
        });
    };
};

Folder.Up = () => {
    //
    return (target, key) => {
        //
        return applyParam(target, key, {
            group: { end: true },
        });
    };
};

/**
 * The `@Trigger` decorator can be used on script functions to show a button for it in the property panel
 */
export function Trigger(opts?: TriggerOptions) {
    //
    return (target, key) => {
        //
        return applyParam(target, key, {
            type: "button",
            methodKey: key,
            ...opts,
        });
    };
}

/**
 * The `@Receiver` decorator allows functions to be bound to other component's signals
 */
export function Receiver(opts?: TriggerOptions) {
    //
    return (target, key) => {
        //
        return applyParam(target, key, {
            type: "receiver",
            methodKey: key,
            ...opts,
            isAnnotation: true,
        });
    };
}

/**
 * @deprecated
 */
export function Signal(id: string, opts?: SignalOptions) {
    //
    return (target, key) => {
        //
        return applyParam(target, `event:${id}`, {
            type: "signal",
            name: id,
            ...opts,
            event: id,
            skipLabel: true,
        });
    };
}

export function Presets(...presets: PresetOptions[]) {
    //
    return (target, key) => {
        //
        return applyParam(target, "presets", {
            type: "presets",
            name: "Presets",
            items: presets.map((preset) => ({
                label: preset?.name,
                ...preset,
            })),
        });
    };
}

export function Color(target, key) {
    //
    return applyParam(target, key, { type: "color" });
}

/*
export function Range(min: number, max: number, step: number) {
    //
    return (target, key) => {
        //
        return applyParam(target, key, { min, max, step });
    };
}

export function Image(target, key) {
    //
    return applyParam(target, key, { type: "image" });
}

export function Color(target, key) {
    //
    return applyParam(target, key, { type: "color" });
}

export function Select(
    options: SelectParam["items"],
    opts: Partial<SelectParam> = {}
) {
    //
    return (target, key) => {
        //
        return applyParam(target, key, { type: "select", options, ...opts });
    };
}
*/

/**
 * @public
 *
 * The `@Param` decorator can be used on script properties to show them in the property panel
 * of the script on the studio.
 * if no type defined the engine will try to guess the type from it's default value.
 * some Params need to be initialized, please refer to their documentation page
 */
export function Param(options?: ScriptParam): any;
export function Param(target: any, key: string): any;
export function Param(...args: any[]) {
    //
    if (args.length < 2) {
        //
        return (target, key) => {
            //
            return applyParam(target, key, args[0]);
        };
    } else {
        //
        return applyParam.apply(null, args);
    }
}

/**
 * @internal
 */
export function UseParam() {
    //
    return function (constructor: Function) {
        constructor.prototype[PARAM_KEY] ??= [];
    };
}

const PctForamt = {
    format: (value: number) => {
        return value * 100;
    },
    parse: (value: number) => {
        return value / 100;
    },
};

export const Formats = {
    pct: PctForamt,
};

/**
 * @public
 */
type MediaResource = {
    url: string;
    name: string;
    mimeType: string;
};

/**
 * @public
 */
type ResourceMap = {
    audio: MediaResource;
    image: MediaResource;
    video: MediaResource;
    model: MediaResource;
    avatar: MediaResource;
};

/**
 * @public
 */
type ComponentMap = ComponentTypeMap & {
    any: Component3D;
};

/**
 * @public
 */
export class $Param {
    //

    private static _parseArgs(args: any[], isVal: (v: any) => boolean) {
        if (args.length === 1) {
            if (isVal(args[0])) {
                return {
                    defaultValue: args[0],
                };
            } else {
                return args[0];
            }
        }

        if (args.length === 2) {
            return {
                ...(args[1] ?? {}),
                defaultValue: args[0],
            };
        }

        return {};
    }

    static String(def: string, opts?: StringParam): string;
    static String(opts: StringParam): string;
    static String(): string;
    static String(...args: any[]): string {
        let opts = this._parseArgs(args, is.string);
        return {
            ...opts,
            [IS_PARAM_VAL]: true,
            type: "string",
        } as unknown as string;
    }

    static Secret(opts?: StringParam): string {
        return $Param.String({ ...opts, isSecret: true });
    }

    static Number(def: number, opts?: NumberParam): number;
    static Number(opts: NumberParam): number;
    static Number(): Number;
    static Number(...args: any[]): number {
        let opts = this._parseArgs(args, is.number);
        return {
            ...opts,
            [IS_PARAM_VAL]: true,
            type: "number",
        } as unknown as number;
    }

    static Boolean(def: boolean, opts?: BooleanParam): boolean;
    static Boolean(opts: BooleanParam): boolean;
    static Boolean(): boolean;
    static Boolean(...args: any[]): boolean {
        let opts = this._parseArgs(args, is.boolean);
        return {
            ...opts,
            [IS_PARAM_VAL]: true,
            type: "boolean",
        } as unknown as boolean;
    }

    static Color(def: string, opts?: ColorParam): string;
    static Color(opts: ColorParam): string;
    static Color(): string;
    static Color(...args: any[]): string {
        let opts = this._parseArgs(args, is.string);
        return {
            [IS_PARAM_VAL]: true,
            type: "color",
            ...opts,
        } as unknown as string;
    }

    static Animation(def: string, opts?: AnimationParam): string;
    static Animation(opts: AnimationParam): string;
    static Animation(): string;
    static Animation(...args: any[]): string {
        let opts = this._parseArgs(args, is.string);
        return {
            [IS_PARAM_VAL]: true,
            type: "animation",
            ...opts,
        } as unknown as string;
    }

    static Vector2(x: number, y: number, opts?: Vec2Param): Vector2;
    static Vector2(def: XY, opts?: Vec2Param): Vector2;
    static Vector2(opts: Vec2Param): Vector2;
    static Vector2(): Vector2;
    static Vector2(...args: any[]): Vector2 {
        if (is.number(args[0]) && is.number(args[1])) {
            let vec2 = new Vector2(args[0], args[1]);
            args = [vec2].concat(args.slice(2));
        }
        let opts = this._parseArgs(args, is.vec2);

        if (opts.defaultValue) {
            opts.defaultValue = new Vector2(
                opts.defaultValue.x,
                opts.defaultValue.y
            );
        }

        return {
            [IS_PARAM_VAL]: true,
            type: "vec2",
            ...opts,
        } as unknown as Vector2;
    }

    static Vector3(x: number, y: number, z: number, opts?: Vec3Param): Vector3;
    static Vector3(def: XYZ, opts?: Vec3Param): Vector3;
    static Vector3(opts: Vec3Param): Vector3;
    static Vector3(): Vector3;
    static Vector3(...args: any[]): Vector3 {
        if (is.number(args[0]) && is.number(args[1]) && is.number(args[2])) {
            let vec3 = new Vector3(args[0], args[1], args[2]);
            args = [vec3].concat(args.slice(3));
        }
        let opts = this._parseArgs(args, is.vec3);

        if (opts.defaultValue) {
            opts.defaultValue = new Vector3(
                opts.defaultValue.x,
                opts.defaultValue.y,
                opts.defaultValue.z
            );
        }

        return {
            [IS_PARAM_VAL]: true,
            type: "vec3",
            ...opts,
        } as unknown as Vector3;
    }

    static Select<T extends OptId, V extends T, O extends Opt<T>>(
        options: Options<T>,
        opts?: SelectParam<V>
    ): T;
    static Select<T extends OptId, V extends T, O extends Opt<T>>(
        options: Options<T>,
        def: V,
        opts?: SelectParam<V>
    ): T;
    static Select<const T extends OptId>(opts: SelectParam<T>): T;
    static Select(...args: any[]): any {
        //

        let opts: any = {};
        if (is.array(args[0]) || is.func(args[0])) {
            opts = {
                options: args[0],
            };

            if (is.strOrNum(args[0])) {
                opts = {
                    ...opts,
                    defaultValue: args[1],
                    ...(args[2] ?? {}),
                };
            } else {
                opts = {
                    ...opts,
                    ...(args[1] ?? {}),
                };
            }
        } else {
            opts = args[0];
        }

        return {
            [IS_PARAM_VAL]: true,
            type: "select",
            ...opts,
        } as any;
    }

    static Trigger(action: () => void, opts?: TriggerParam): null;
    static Trigger(opts: TriggerParam): null;
    static Trigger(...args: any[]) {
        //
        let opts = {} as TriggerParam;

        if (is.func(args[0])) {
            opts = args[1] ?? {};
            opts.action = args[0];
        } else {
            opts = args[0];
        }

        return {
            [IS_PARAM_VAL]: true,
            type: "button",
            ...opts,
            defaultValue: undefined,
        } as null;
    }

    static Action<T>(
        argType: T,
        callback: Callback<T>,
        opts?: ReceiverParam
    ): Action<T>;
    static Action(callback: Callback<void>, opts?: ReceiverParam): Action<void>;
    static Action(opts: ReceiverParam): Action<unknown>;
    static Action(...args: any[]) {
        //
        let argType = null;
        let callback = null;
        let opts = null;

        if (is.paramVal(args[0])) {
            argType = args[0];
            if (is.func(args[1])) {
                callback = args[1];
                opts = args[2];
            } else {
                opts = args[1];
            }
        } else if (is.func(args[0])) {
            callback = args[0];
            opts = args[1];
        } else {
            opts = args[0];
        }

        return {
            [IS_PARAM_VAL]: true,
            type: "receiver",
            argType,
            callback,
            ...(opts ?? {}),
            defaultValue: undefined,
        } as null;
    }

    static Resource<T extends keyof ResourceMap>(of: T): ResourceMap[T] {
        return {
            [IS_PARAM_VAL]: true,
            type: "resource",
            typeof: of,
        } as any;
    }

    static Component<T extends Component3D>(of: new () => T): T;
    static Component(of: "any"): Component3D;
    static Component<T extends keyof ComponentMap>(of: T): ComponentMap[T];
    static Component(of: any) {
        return {
            [IS_PARAM_VAL]: true,
            type: "component",
            typeof: of,
        } as any;
    }

    static Signal<T>(type: T, opts?: SignalParam): SignalEmitter<T>;
    static Signal(opts?: SignalParam): SignalEmitter<unknown>;
    static Signal(...args: any[]): any {
        //
        let emitType = null;
        let opts = null;

        if (is.paramVal(args[0])) {
            //
            emitType = args[0];
            opts = args[1];
        } else {
            opts = args[0];
        }

        return {
            [IS_PARAM_VAL]: true,
            type: "signal",
            emitType,
            ...(opts ?? {}),
            defaultValue: undefined,
        } as any;
    }

    static Object<T>(instanceOrClass: T | (new () => T), opts?: GroupParam): T {
        let instance =
            typeof instanceOrClass === "function"
                ? new (instanceOrClass as any)()
                : instanceOrClass;
        return {
            [IS_PARAM_VAL]: true,
            type: "group",
            factory: instance.constructor,
            children: getParams(instance, true),
            defaultValue: is.paramVal(instance) ? undefined : instance,
            ...opts,
        } as unknown as T;
    }

    static Folder<T>(label: string, t: T): T {
        if (is.paramVal(t)) {
            (t as any).useFolder = { label };
        }

        return t;
    }

    static Union<const T extends Array<Tagged<any>>>(
        options: T,
        opts?: UnionParam
    ): T[number] {
        //
        return {
            [IS_PARAM_VAL]: true,
            type: "union",
            options,
            ...(opts ?? {}),
        } as unknown as any;
    }

    static Array<T>(init: Array<T>, opts?: ArrayParam<T>): Array<T>;
    static Array<T>(itemType: T, opts?: ArrayParam<T>): Array<InstanceType<T>>;
    static Array(initOrType: any, opts: any = {}) {
        //
        if (is.array(initOrType)) {
            //
            if (initOrType.length === 0) {
                //
                throw new Error("Array must have at least one item");
            }

            let constr = initOrType[0].constructor;

            if (!constr) {
                //
                throw new Error(
                    "Array init values must be numbers, strings, booleans or objects"
                );
            }

            opts = {
                ...opts,
                type: "array",
                defaultValue: initOrType,
                itemParam: getParam("@@index", initOrType[0]),
            };
        } else {
            //
            let val = initOrType;

            if (typeof val === "function") {
                //
                val =
                    val === Number
                        ? 0
                        : val === String
                        ? ""
                        : val === Boolean
                        ? false
                        : new val();
            }

            opts = {
                ...opts,
                type: "array",
                itemParam: getParam("@@index", val),
            };
        }

        return {
            [IS_PARAM_VAL]: true,
            ...opts,
        } as unknown as any;
    }

    static Map<T>(
        itemType: T,
        opts?: MapParam
    ): Record<string, InstanceType<T>>;
    static Map(initOrType: any, opts: any = {}) {
        //
        if (is.paramVal(initOrType)) {
            opts = {
                ...opts,
                itemParam: getParam("@@key", initOrType),
            };
        } else {
            /*
            let values = Object.values(initOrType);

            if (!values.length) {
                throw new Error("Map must have at least one item");
            }

            let itemType = values[0].constructor;

            if (!itemType) {
                throw new Error(
                    "Map init values must be numbers, strings, booleans or objects"
                );
            }

            let val = values[0] as any;
            */

            let val = initOrType;

            if (typeof val === "function") {
                //
                val =
                    val === Number
                        ? 0
                        : val === String
                        ? ""
                        : val === Boolean
                        ? false
                        : new val();
            }

            val = $Param.Object(val);

            opts = {
                ...opts,
                itemParam: getParam("@@key", val),
                defaultValue: initOrType,
            };
        }

        return {
            ...opts,
            [IS_PARAM_VAL]: true,
            type: "map",
        } as unknown as any;
    }
}

type InstanceType<T> = T extends new (...args: any[]) => infer R
    ? ItemType<R>
    : T;

type ItemType<R> = R extends Number
    ? number
    : R extends String
    ? string
    : R extends Boolean
    ? boolean
    : R;

export function getParams(instance: any, autoCreate: boolean) {
    //
    let declParams = (instance?.[PARAM_KEY] ?? []) as ParamDecl[];

    const declMap = declParams.reduce((acc, decl) => {
        acc[decl.key] = decl;
        return acc;
    }, {});

    let keys = Object.keys(instance);

    // We use the order of `@Param` annotation only if every param is decorated
    let useInstOrder = keys.some(
        (key) => is.paramVal(instance[key]) && !declMap[key]
    );

    let declKeys = useInstOrder ? [] : declParams.map((decl) => decl.key);

    keys.forEach((key) => {
        //
        let val = instance[key];

        const isParamVal = is.paramVal(val);

        if (isParamVal || autoCreate) {
            //
            declMap[key] = { key, options: declMap[key]?.options ?? {} };
        }

        if (useInstOrder && declMap[key]) {
            declKeys.push(key);
        }
    });

    // if (!Object.keys(declParams).length && autoCreate) {
    //     //
    //     keys.forEach((key) => {
    //         //
    //         declParams[key] = { key, options: {} };

    //         declKeys.push(key);
    //     });
    // }

    let result = [];

    declKeys.forEach((key) => {
        //
        let decl = declMap[key];

        let param = getParam(key, instance[key], decl.options);

        if (param) {
            //
            result.push({ key, param });
        }
    });

    return result;
}

export function getParam(key: string, value: any, decl: any = {}) {
    //
    if (is.paramVal(value)) {
        //
        if (value.type === "signal") {
            //
            value.event = key;
        }

        value.group ??= decl.group;

        return value;
    }

    let declWithDef = {
        ...decl,
        defaultValue: value,
    };

    let fn = declTypeMap[decl.type];

    if (fn) {
        return fn.call($Param, declWithDef);
    }

    if (is.string(value)) {
        // check if it matches a color
        if (decl.type === "animation") {
            return $Param.Animation(declWithDef);
        } else if (value.match(/^#[0-9a-f]{6}$/i)) {
            return $Param.Color(declWithDef);
        } else if (decl.options) {
            return $Param.Select(declWithDef);
        } else {
            return $Param.String(declWithDef);
        }
    } else if (is.number(value)) {
        if (decl.options) {
            return $Param.Select(declWithDef);
        } else {
            return $Param.Number(declWithDef);
        }
    } else if (is.boolean(value)) {
        return $Param.Boolean(declWithDef);
    } else if (is.vec3(value)) {
        return $Param.Vector3(declWithDef);
    } else if (is.vec2(value)) {
        return $Param.Vector2(declWithDef);
    } else if (is.array(value)) {
        return $Param.Array(value, decl);
    } else if (is.paramObj(value)) {
        return $Param.Object(value, decl);
    } else {
        return null;
    }
}

const declTypeMap = {
    string: $Param.String,
    text: $Param.String,
    number: $Param.Number,
    boolean: $Param.Boolean,
    color: $Param.Color,
    vec2: $Param.Vector2,
    vec3: $Param.Vector3,
    xyz: $Param.Vector3,
    select: $Param.Select,
    trigger: (opts) => ({
        [IS_PARAM_VAL]: true,
        type: "button",
        ...opts,
        defaultValue: undefined,
    }),
    receiver: (opts) => ({
        [IS_PARAM_VAL]: true,
        type: "receiver",
        ...opts,
        defaultValue: undefined,
    }),
    signal: $Param.Signal,
};

const is = {
    string: (v: any) => typeof v === "string",
    number: (v: any) => typeof v === "number",
    strOrNum: (v: any) => is.string(v) || is.number(v),
    boolean: (v: any) => typeof v === "boolean",
    vec2: (v: any) => v != null && is.number(v.x) && is.number(v.y),
    vec3: (v: any) =>
        v != null && is.number(v.x) && is.number(v.y) && is.number(v.z),
    array: (v: any) => Array.isArray(v),
    func: (v: any) => typeof v === "function",
    paramVal: (v: any) => v?.[IS_PARAM_VAL],
    paramObj: (v: any) => typeof v === "object" && v[PARAM_KEY],
};

export function Rpc(opts?: { reply?: boolean }) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        //
        const rpc = (target[RPC_KEY] ??= {});
        rpc[propertyKey] = opts ?? {};
    };
}

export function ServerOnly() {
    //
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        //
        if (!IS_SERVER_MODE) {
            descriptor.value = () => {};
        }
    };
}

export function Message() {
    return Rpc({ reply: false });
}

export function getRpcMethods(target: any) {
    return target[RPC_KEY] ?? {};
}
