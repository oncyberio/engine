import {
    DataSchema,
    PathLike,
    asPath,
    asStrPath,
    copyValue,
} from "./dataschema";

export interface DerivedDataOpts<T> {
    base?: DataWrapper<T>;
    ownData?: Partial<T>;
    nested?: boolean;
    skipMerge?: boolean;
}

export interface BaseDataOpts<T> {
    schema?: DataSchema;
    ownData?: Partial<T>;
    nested?: boolean;
}

export type DataOpts<T> = DerivedDataOpts<T> | BaseDataOpts<T>;

const dependencyMap: Record<string, DataWrapper[]> = {};

/**
 * @internal
 */
export class DataWrapper<T = any> {
    //

    private _nested: boolean;

    //#region Properties + Constructor
    // protected _listeners = new Set<() => unknown>();

    protected _listeners = [];

    _dataSchema: DataSchema;

    protected _base: DataWrapper<T>;

    protected _ownData: Partial<T>;

    protected _prefabMap: Record<string, string> = null;

    protected _mergedData: T;

    _properPaths: Record<string, boolean> = {};

    _proxy: any;

    _proxyCache: any = {};

    _skipMerge = false;

    private _cache: any = {
        ownData: null,
        prefabData: null,
    };

    constructor(private opts: DataOpts<T>) {
        //
        let base: DataWrapper;

        if ("base" in opts) {
            //
            base = opts.base;

            this._dataSchema = opts.base._dataSchema;

            this._skipMerge = opts.skipMerge ?? false;
            //
        } else if ("schema" in opts) {
            //
            base = null;

            this._dataSchema = opts.schema;

            this._skipMerge = true;
            //
        } else {
            //
            throw new Error("Invalid options");
        }

        this._setBase(base, opts?.nested);

        this._ownData = opts.ownData ?? this._dataSchema.empty();

        this._proxy = this._createDataProxy();

        if (this._skipMerge) {
            //
            this._pull();
        }
    }

    private _getProperPaths(nested: boolean) {
        //
        return this._dataSchema.getProperPaths(nested ?? false);
    }

    get _properPathsList() {
        //
        return Object.keys(this._properPaths);
    }
    //#endregion

    //#region Getters
    get id() {
        // @ts-ignore
        return this._ownData.id;
    }

    /**
     * Returns the base data wrapper
     */
    get base() {
        //
        return this._base;
    }

    /**
     * Return the prefabIds => componentIds map for this object
     */
    get prefabMap() {
        return this._prefabMap;
    }

    set prefabMap(v) {
        this._prefabMap = v;
    }

    private _setNested(val) {
        //
        this._nested = val ?? false;

        this._properPaths = this._getProperPaths(this._nested);
    }

    private _unlistenBase = null;

    private _setBase(base: DataWrapper, nested?: boolean) {
        //
        if (this._base === base) return;

        this._unlistenBase?.();

        this._base = base;

        if (this._base) {
            this._unlistenBase = this._base.onChange(this.notify);
        }

        this._setNested(nested ?? this._base?._nested ?? false);
    }

    /**
     * Returns the own data of the wrapper (the data that is not part of the base data)
     */
    get ownData() {
        //
        return this._ownData;
    }

    /**
     * Returns the prefab data of the wrapper (the data that is part of the base data)
     */
    get prefabData() {
        //
        return this._base?.data;
    }

    /**
     * Is this a root data wrapper (i.e. it has no base)
     * Root data wrappers are usually created from the component factory
     * and serves as a base for other data wrappers
     */
    get isRoot() {
        //
        return this._base == null;
    }

    /**
     * Derived data wrappers are created from a non data wrapper
     * Typically
     *  - true when for prefabs and prefab instances
     *  - false for non prefab components
     */
    get isDerived() {
        //
        return this._base != null && !this._base.isRoot;
    }
    //#endregion

    //#region Change Notification@
    onChange(fn) {
        //
        this._listeners.push(fn);

        return () => {
            //
            this._listeners.splice(this._listeners.indexOf(fn), 1);
        };
    }

    private _listenersPaused = false;

    pauseNotifications() {
        //
        this._listenersPaused = true;
    }

    resumeNotifications(notify = true) {
        //
        this._listenersPaused = false;

        if (notify) this.notify();
    }

    notify = () => {
        //
        if (this._listenersPaused) return;

        let i = 0;
        while (i < this._listeners.length) {
            this._listeners[i]();

            i++;
        }

        const dependencies =
            dependencyMap[this.prefabMap?.[this.id] || this.id];
        if (!dependencies) return;

        for (let i = 0; i < dependencies.length; i++) {
            dependencies[i]?.notify?.();
        }
    };

    addToDependencies(refId: string) {
        const id = this.prefabMap?.[refId] || refId;
        dependencyMap[id] ??= [];
        dependencyMap[id].push(this);
    }

    removeFromDependencies(refId: string) {
        const id = this.prefabMap?.[refId] || refId;
        if (!dependencyMap[id]) return;
        const index = dependencyMap[id].indexOf(this);
        if (index < 0) return;
        dependencyMap[id].splice(index, 1);
    }

    //#endregion

    //#region Data Access
    /**
     * Checks if the value at the given path is a final value
     * (ie numbers, strings, value objects like position, rotation, etc.)
     */
    isValue(value: any, path: string) {
        //
        return this._dataSchema.isValue(value, path);
    }

    /**
     * Returns all the leaf paths of the data
     */
    get paths() {
        //
        return this._dataSchema.paths(this.ownData);
    }

    /**
     * Returns true if this wrapper's own data has the given path
     */
    hasOwn(path: PathLike) {
        //
        return this._dataSchema.has(this._ownData, path);
    }

    /**
     * Returns the value of the given path in the own data
     */
    getOwnValue(path: PathLike) {
        //
        return this._dataSchema.get(this._ownData, path);
    }

    /**
     * Returns a subset of the data based on the given paths
     */
    extractPaths(paths: PathLike[]) {
        //
        return this._dataSchema.extract(this._ownData, paths);
    }

    /**
     * Returns the value of the given path in the base data
     */
    getBaseValue(path: PathLike) {
        //
        if (this._base == null) return null;

        return this._dataSchema.get(this._base.data, path);
    }

    /**
     * Returns true if the *full* data has the given path (own or base data)
     */
    has(path: PathLike) {
        //
        return this._dataSchema.has(this.data, path);
    }

    /**
     * Returns the value of the given path in the *full* data (own or base data)
     */
    get(path: PathLike) {
        //
        return this._dataSchema.get(this.data, path);
    }

    getRefId(id: string) {
        //
        return this.prefabMap?.[id] || id;
    }

    /**
     * Sets the value of the given path in the own data
     */
    set(path: PathLike, value: any, notify = true) {
        //
        if (value?.$$id) {
            if (this.prefabMap) {
                value.$$id =
                    Object.keys(this.prefabMap).find(
                        (k) => this.prefabMap[k] === value.$$id
                    ) || value.$$id;
            }

            if (value?.$$paramType === "bind") {
                const previousData = this._dataSchema.get(this._ownData, path);
                if (
                    previousData?.$$paramType === "bind" &&
                    previousData?.$$id
                ) {
                    this.removeFromDependencies(previousData.$$id);
                }
                this.addToDependencies(value.$$id);
            }
        }

        const strPath = asStrPath(path);

        // if we're setting a subpath of a derived value (eg array access), we need
        // to get the whole value and set the subpath on it
        if (this._dataSchema._valuePaths[strPath] == null) {
            // look for the closest value path
            let prefix: string[] = null;
            let suffix: string[] = null;

            for (let valuePath in this._dataSchema._valuePaths) {
                if (strPath.startsWith(valuePath)) {
                    prefix = asPath(valuePath);
                    suffix = strPath.slice(valuePath.length + 1).split(".");
                    break;
                }
            }

            if (prefix) {
                //
                path = prefix;

                let parentValue = copyValue(this.get(prefix));

                value = this._setValue(parentValue, suffix, value);
            }
        }

        this._ownData = this._dataSchema.set(this._ownData, path, value);

        if (notify) {
            this.notify();
        }
    }

    private _getValue(data: any, path: string[]) {
        //
        let obj = data;

        for (let i = 0; i < path.length; i++) {
            //
            obj = obj[path[i]];
        }

        return obj;
    }

    private _setValue(object: any, path: string[], value: any) {
        //
        const key = path[0];

        if (path.length === 1) {
            // fast track: mutably set the value
            object[key] = value;
            //
        } else {
            // for nested paths, we need to clone the objects
            const data = object[key];

            let current = copyValue(data);

            object[key] = current;

            // immutable set the value on target

            for (let i = 1; i < path.length - 1; i++) {
                //
                const childKey = path[i];

                const childData = current[childKey];

                current = current[childKey] = copyValue(childData);
            }

            current[path[path.length - 1]] = value;
        }

        return object;
    }

    /**
     * Used at runtime for perfs
     */
    setMerged(path: string[], value: any, notify = true) {
        //
        this._setValue(this._mergedData, path, value);

        if (notify) {
            this.notify();
        }
    }

    getMerged(path: string[]) {
        //
        return this._getValue(this._mergedData, path);
    }

    setOwnData(data: Partial<T>, notify = true) {
        //
        this._ownData = data;

        if (notify) this.notify();
    }

    /**
     * Assigns the given data to the own data
     */
    assign(data: Partial<T>) {
        //
        this._ownData = this._dataSchema.assign(this._ownData, data);

        this.notify();
    }

    /**
     * Remove the given paths from the own data
     */
    unset(...paths: PathLike[]) {
        //
        this._ownData = paths.reduce((acc, path) => {
            //
            return this._dataSchema.unset(acc, path);
            //
        }, this._ownData);

        this.notify();
    }

    /**
     * Remove from the own data the paths that are also in the given data
     */
    substract(obj: any) {
        //
        this._ownData = this._dataSchema.substract(this._ownData, obj);
    }

    /**
     * Returns a subset of the data based on the paths in the given object
     */
    extract(obj: any) {
        //
        return this._dataSchema.extract(this._ownData, obj);
    }

    /**
     * Assigne the given data to the own data, but only if the own data does not have the given paths
     */
    union(data: Partial<T>) {
        //
        this._ownData = this._dataSchema.union(data, this._ownData);

        this.notify();
    }

    /**
     * Returns true if the own data includes the given data
     * (i.e. all the properties of the given data are in the own data and have the same values)
     */
    includes(data: Partial<T>) {
        //
        return this._dataSchema.includes(this._ownData, data);
    }
    //#endregion

    //#region Merged Data

    get data() {
        //
        if (this._skipMerge) {
            //
            return this._mergedData;
        }

        if (
            this._cache.ownData === this._ownData &&
            this._cache.prefabData === this.prefabData
        ) {
            //
            return this._mergedData;
        }

        this._pull();

        return this._mergedData;
    }

    protected _pull() {
        //
        this._mergedData = this._dataSchema.union(
            this._ownData,
            this.prefabData
        );

        this._cache.ownData = this._ownData;

        this._cache.prefabData = this.prefabData;
    }
    //#endregion

    //#region Override management
    private _isOverridable(path: string) {
        //
        return !this._properPaths[path] && this._dataSchema._valuePaths[path];
    }

    private _sanitizeOverridePaths(paths: string[]) {
        //
        paths = paths.filter((path) => this._isOverridable(path));

        return this._dataSchema.expandPathPrefixes(this._ownData, paths);
    }

    /**
     * A value is considered an override if:
     *
     * - the wrapper is derived
     * - it is not part of the base data
     * - it is not part of the proper paths
     */
    getOverrideValue(path: string) {
        //
        if (!this.isDerived || !this._isOverridable(path)) return null;

        return this.getOwnValue(path);
    }

    /**
     * cf. getOverrideValue
     */
    isOverride(path: PathLike) {
        //
        const strPath = asStrPath(path);

        if (!this.isDerived || !this._isOverridable(strPath)) return false;

        return this.hasOwn(path);
    }

    /**
     * Returns true if the own data has overrided of the given paths
     * If no paths are given, it checks if there are any overrides at all
     */
    hasOverrides(paths?: string[]) {
        //
        if (!this.isDerived) return false;

        paths = this._sanitizeOverridePaths(paths ?? this.paths);

        return paths.some((path) => this.hasOwn(path));
    }

    /**
     * Returns the overrides of the given paths
     * If no paths are given, it returns all the overrides
     */
    getOverrides(paths?: string[], force = false) {
        //
        if (!this.isDerived) return {};

        if (!paths) {
            //
            return this._dataSchema.withoutPaths(
                this._ownData,
                this._properPathsList
            );
        }

        paths = this._sanitizeOverridePaths(paths);

        return this._dataSchema.onlyPaths(this._ownData, paths);
    }

    /**
     * Returns the template data to make a prefab out of this data wrapper
     * The template data is own data minus proper paths
     * For convenience, the type and prefabId are included
     */
    getTemplateData(opts?: { nested?: boolean }) {
        //
        /**
            In addition to the overrides, we need to include the type and prefabId
             
            base1 = { id: "xx", type: "mesh", color: wwhite, ...rest }

            prefab1 = { id: "p1", template: { type: "mesh", ...rest } }
                instance1 = { id: "xx", type: "mesh", prefabId: "p1", color: red }

                derived1 = { id: "p1-d1", template: { type: "mesh", prefabId: "p1", color: red } }
        */

        const properPathsList = this._getProperPaths(opts?.nested);

        const template = this._dataSchema.withoutPaths(
            this._ownData,
            Object.keys(properPathsList)
        );

        const ownData = this.ownData as any;

        template.type = ownData.type;

        template.name = ownData.name;

        if (ownData.prefabId) {
            //
            template.prefabId = ownData.prefabId;
        }

        return template;
    }

    /**
     * Removes the overrides of the given paths
     * If no paths are given, it removes all the overrides
     */
    removeOverrides(paths?: string[]) {
        //
        if (!this.isDerived) return {};

        const overrides = this.getOverrides(paths);

        this._ownData = this._dataSchema.substract(this._ownData, overrides);

        this.notify();

        return overrides;
    }

    /**
     * Applies the overrides of the given paths to the base data
     * If no paths are given, it applies all the overrides
     *
     * Returns a state object that can be used to unapply the overrides
     */
    applyOverrides(paths?: string[]) {
        //
        if (!this.isDerived) return;

        const overrides = this.removeOverrides(paths);

        paths ??= this._dataSchema.paths(overrides);

        // save old values in the base
        const baseValues = this._dataSchema.onlyPaths(
            this._base.ownData,
            paths
        );

        this.base.assign(overrides);

        this.unset(...paths);

        return { __OP__: "apply", baseValues, overrides };
    }

    /**
     * Unapplies the given state object returned by applyOverrides
     */
    unapplyOverrides(state: any) {
        //
        if (state?.__OP__ !== "apply") {
            //
            throw new Error("Invalid state");
        }

        this.base.substract(state.overrides);

        this.base.assign(state.baseValues);

        this.assign(state.overrides);

        this.notify();
    }

    /**
     * Look for external refs that need to be internal
     */
    internalizeRefs(map: any) {
        const changes = this.internalizeRefsData(this._ownData, map);
        if (changes) this.notify();
        this.base?.internalizeRefs(map);
    }

    internalizeRefsData(data: any, map: any) {
        let changes = 0;
        Object.entries(data || {}).forEach(([k, v]: any) => {
            if (typeof v !== "object") return;
            if (v?.$$id && map[v.$$id]) {
                v.$$id = map[v.$$id];
                changes++;
            } else {
                changes += this.internalizeRefsData(v, map);
            }
        });
        return changes;
    }

    /**
     * Resets all the overrides
     */
    reset() {
        //
        if (!this.isDerived) return;

        this._ownData = this._dataSchema.onlyPaths(
            this._ownData,
            this._properPathsList
        );

        this.notify();
    }

    _resetPrefabMap() {
        this.prefabMap = {};
        return this.prefabMap;
    }

    /**
     * Creates a prefab out of the own data and sets it as the new base
     */
    makePrefab() {
        //
        const overrides = this._dataSchema.withoutPaths(
            this._ownData,
            this._properPathsList
        );

        this._ownData = this._dataSchema.onlyPaths(
            this._ownData,
            this._properPathsList
        );

        const newPrefab = new DataWrapper({
            base: this._base,
            ownData: overrides,
        });

        this._setBase(newPrefab);

        this.notify();

        return newPrefab;
    }

    saveState() {
        //
        return {
            base: this._base,
            ownData: this._ownData,
        };
    }

    restoreState(state) {
        //
        this._setBase(state.base);

        this._ownData = state.ownData;

        this.notify();
    }

    /**
     * Detaches the own data from the base data
     * The base's own data is merged with the own data
     */
    detach() {
        //
        if (!this.isDerived) return;

        const base = this.base;

        const newBase = base.base;

        this._ownData = this._dataSchema.union(this._ownData, base.ownData);

        this._setBase(newBase);

        this.notify();
    }

    /**
     * Attaches this data wrapper to the given base data wrapper
     * All overrides will be removed from the own data
     */
    rebase(prefab: DataWrapper<T>) {
        //
        this._setBase(prefab);
        this._ownData = this._dataSchema.onlyPaths(
            this.data,
            this._properPathsList
        );
        this.notify();
    }

    /**
     * Creates a new derived data wrapper with the given own data
     * The new data wrapper will have this data wrapper as the base
     */
    derive(ownData: T, opts?: DerivedDataOpts<T>) {
        //
        return new DataWrapper({
            ...this.opts,
            ...opts,
            base: this,
            ownData,
        });
    }

    /**
     * Creates a Base (root) data wrapper with the given own data
     */
    static getBase<T>(schema: DataSchema, ownData: Partial<T> = {}) {
        //
        return new DataWrapper<T>({
            schema,
            ownData: schema.getDefaultData(),
        });
    }

    /**
     * Creates a proxy object that allows to access the data in a more convenient way
     */
    private _createDataProxy(prefix = "") {
        //

        if (prefix && prefix in this._proxyCache) {
            //
            return this._proxyCache[prefix];
        }

        const handler: ProxyHandler<any> = {
            //
            get: (target, prop) => {
                //
                if (target[prop]) return target[prop];

                const path = prefix + String(prop);

                // if the path is final, return the value
                // otherwise, return a new proxy with the new path

                const value = this.get(path);

                if (this.isValue(value, path)) {
                    return value;
                }

                return this._createDataProxy(path + ".");
            },

            set: (target, prop, value) => {
                //
                const path = prefix + String(prop);

                this.set(path, value);

                return true;
            },

            deleteProperty: (target, prop) => {
                //
                const path = prefix + String(prop);

                this.unset(path);

                return true;
            },

            getOwnPropertyDescriptor(target, prop) {
                // called for every property
                return {
                    enumerable: true,
                    configurable: true,
                    /* ...other flags, probable "value:..." */
                };
            },

            ownKeys: (target) => {
                //
                const value = prefix
                    ? this.get(prefix.slice(0, prefix.length - 1))
                    : this.data;

                if (typeof value !== "object") return [];

                return Object.keys(value);
            },
        };

        const proxy = new Proxy(
            {
                DATA_PROXY_ID: this.id,
            },
            handler
        );

        this._proxyCache[prefix] = proxy;

        return proxy;
    }

    private _wasDisposed = false;
    dispose() {
        //
        if (this._wasDisposed) return;

        this._wasDisposed = true;

        this._listeners = [];

        this._setBase(null);

        this._proxy = null;

        this._proxyCache = null;
    }
}
