//
import { deepEqual, hasOwn } from "engine/utils/js";

export type PathLike = string | string[];

export function asPath(path: PathLike): string[] {
    //
    return Array.isArray(path) ? path.slice() : path.split(".");
}

export function asStrPath(path: PathLike): string {
    //
    return Array.isArray(path) ? path.join(".") : path;
}

export function parentPath(path: PathLike) {
    //
    const parts = asPath(path);

    return parts.slice(0, parts.length - 1);
}

export function getValue(obj: any, key: string) {
    //
    return obj?.[key];
}

export function copyValue(obj: any) {
    //
    return Array.isArray(obj) ? obj.slice() : { ...obj };
}

export function setValue(obj: any, key: any, value: any) {
    //
    if (Array.isArray(obj)) {
        //
        if (typeof key !== "number") {
            //
            throw new Error("Invalid key for array");
        }

        obj = obj.slice();

        obj[key] = value;

        return obj;
    } else {
        //
        return {
            ...obj,
            [key]: value,
        };
    }
}

function unsetValue(obj: any, key: any) {
    //
    if (Array.isArray(obj)) {
        //
        if (typeof key !== "number") {
            //
            throw new Error("Invalid key for array");
        }

        obj = obj.slice();

        obj.splice(key, 1);

        return obj;
        //
    } else {
        //
        const { [key]: _, ...rest } = obj;

        return Object.keys(rest).length == 0 ? null : rest;
    }
}

export interface DataSchemaOpts {
    valuePaths?: string[];
    properPaths?: string[];
    topProperPaths?: string[];
    defaultData?: any;
}

const defValuePaths = [
    "position",
    "rotation",
    "scale",
    "collider.translationLock",
    "collider.rotationLock",
];

export class DataSchema {
    //

    private _defaultData: any;

    /**
     * Paths that are considered values
     * We can't mutate values inside these paths
     */
    _valuePaths: Record<string, boolean> = {};

    /**
     * Paths that are considered proper to this object
     * Those paths are not part of the template data so they're not
     * copied to prefabs from instances
     *
     * If nested is true, the paths are considered proper only for the top object
     */
    protected _topProperPaths: Record<string, boolean> = {
        parentId: true,
        position: true,
        rotation: true,
    };

    protected _properPaths: Record<string, boolean> = {
        id: true,
        parentId: true,
        type: true,
        name: true,
        "script.identifier": true,
        "script._isPlayer": true,
        _version: true,
        _batchId: true,
        _index: true,
        _hidden: true,
        _netId: true,
        netState: true,
    };

    constructor(opts?: DataSchemaOpts) {
        //
        this.setDefaultData(opts?.defaultData ?? {});

        this.setValuesPaths(opts?.valuePaths);

        opts?.properPaths?.forEach((path) => {
            //
            this._properPaths[path] = true;
            //
        });

        opts?.topProperPaths?.forEach((path) => {
            //
            this._topProperPaths[path] = true;
            //
        });
    }

    getProperPaths(nested: boolean) {
        //
        const result = { ...this._properPaths };

        if (!nested) {
            //
            Object.assign(result, this._topProperPaths);
        }

        return result;
    }

    getDefaultData() {
        //
        return structuredClone(this._defaultData);
    }

    setDefaultData(data: any) {
        //
        this._defaultData = structuredClone(data);
    }

    setValuesPaths(paths: string[] = []) {
        //
        this._valuePaths = {};

        defValuePaths.forEach((path) => {
            //
            this._valuePaths[path] = true;
        });

        paths.forEach((path) => {
            //
            this._valuePaths[path] = true;
        });
    }

    protected _isObject(item: any) {
        //
        return item != null && typeof item === "object" && !Array.isArray(item);
    }

    /**
     * Returns true if the item is a value or if the path is a value path
     */
    isValue(item: any, path: string) {
        //
        return !this._isObject(item) || this._valuePaths[path];
    }

    private _pathsCache = new WeakMap<any, string[]>();

    /**
     * Returns the paths to final values in the object
     */
    paths(obj: any) {
        //
        let paths = this._pathsCache.get(obj);

        if (paths) return paths;

        paths = [];

        this.forEachValue(obj, (value, path) => {
            //
            if (value == null) return;

            paths.push(path);
        });

        this._pathsCache.set(obj, paths);

        return paths;
    }

    expandPathPrefixes(obj: any, prefixes: string[]): string[] {
        //
        const paths = this.paths(obj);

        return paths.filter((path) =>
            prefixes.some(
                (prefix) => path === prefix || path.startsWith(prefix + ".")
            )
        );
    }

    /**
     * Returns true if the object has the given path
     * Returns false if the path is inside a value path
     */
    has(obj: any, path: PathLike) {
        //
        const parts = asPath(path);

        let currentPath = "";

        for (let i = 0; i < parts.length; i++) {
            //
            const key = parts[i];

            currentPath += key;

            if (obj == null || !hasOwn(obj, key)) {
                //
                return false;
            }

            obj = obj[key];

            currentPath += ".";
        }

        return true;
    }

    /**
     * Returns the value at the given path
     */
    get(obj: any, path: PathLike) {
        //
        const parts = asPath(path);

        return parts.reduce(getValue, obj);
    }

    /**
     * Sets the value at the given path; Fails if the path is inside a value path
     */
    set(obj: any, path: PathLike, value: any) {
        //
        if (value === undefined) {
            //
            return this.unset(obj, path);
        }

        const parts = asPath(path);

        return this._setRec(obj, parts, value);
    }

    private _setRec(obj: any, parts: string[], value: any, prefix = "") {
        //
        const [key, ...rest] = parts;

        if (rest.length === 0) {
            //
            return setValue(obj, key, value);
        }

        const currentPath = prefix + key;

        let child = obj[key];

        // disable temporarily until we merge array-params
        if (child != null && this.isValue(child, currentPath)) {
            //
            throw new Error("Cannot mutate values on " + currentPath);
        }

        child ??= {};

        const newVal = this._setRec(child, rest, value);

        return setValue(obj, key, newVal);
    }

    /**
     * Like set but only sets the value if the path doesn't exist
     */
    weakSet(obj: any, path: PathLike, value: any) {
        //
        if (this.has(obj, path)) return obj;

        return this.set(obj, path, value);
    }

    /**
     * Unsets the value at the given path; Fails if the path is inside a value path
     * All empty objects are automatically removed after unsetting
     */
    unset(obj: any, path: PathLike) {
        //
        const parts = asPath(path);

        if (!this.has(obj, path)) return obj;

        const res = this._unsetRec(obj, parts);

        return res ?? {};
    }

    private _unsetRec(obj: any, parts: string[], prefix = "") {
        //
        const [head, ...tail] = parts;

        if (tail.length === 0) {
            //
            return unsetValue(obj, head);
        }

        const currentPath = prefix + head;

        let child = obj[head];

        if (this.isValue(child, currentPath)) {
            //
            throw new Error("Cannot mutate values on " + currentPath);
        }

        child ??= {};

        const val = this._unsetRec(child, tail);

        if (val == null) {
            //
            const { [head]: _, ...rest } = obj;

            return Object.keys(rest).length == 0 ? null : rest;
        }

        return {
            ...obj,
            [head]: this._unsetRec(child, tail),
        };
    }

    forEachValue(
        obj: any,
        fn: (value: any, path: string, parent: any) => void
    ) {
        //
        if (!this._isObject(obj)) return;

        this._forEachValueRec(obj, fn);
    }

    private _forEachValueRec(obj, fn, prefix = "") {
        //
        Object.keys(obj).forEach((key) => {
            //
            const value = obj[key];

            const currentPath = prefix + key;

            if (this.isValue(value, currentPath)) {
                //
                fn(value, currentPath, obj);
                //
            } else {
                //
                this._forEachValueRec(value, fn, currentPath + ".");
            }
        });
    }

    /**
     * Flattens the object into a map of paths to values
     */
    flatten(obj: any) {
        //
        const flat: Record<string, any> = {};

        this.forEachValue(obj, (value, path) => {
            //
            flat[path] = value;
        });

        return flat;
    }

    /**
     * Returns true if the two objects are equal
     */
    equals(obj1: any, obj2: any) {
        //
        return deepEqual(obj1, obj2);
    }

    /**
     * Returns true if obj1 includes obj2
     * obj1 includes obj2 if
     * - all the paths in obj2 are present in obj1
     * - the values in obj2 are equal to the values in obj1
     */
    includes(obj1: any, obj2: any) {
        //
        let equals = true;

        this.forEachValue(obj2, (value, path) => {
            //
            if (!deepEqual(value, this.get(obj1, path))) {
                //
                equals = false;
            }
        });

        return equals;
    }

    /**
     * Returns an empty object
     */
    empty() {
        //
        return {};
    }

    /**
     * Returns true if the object is empty
     */
    isEmpty(obj: any) {
        //
        return Object.keys(obj).length === 0;
    }

    /**
     * Returns an object whose paths are the union of the paths of obj1 and obj2
     * The values are the result of combining the values of obj1 and obj2 with the combineFn
     * if a path doesn't exist in one of the objects, a null/undefined value is passed to the combineFn
     * If the combineFn returns null, the path is removed
     * If the combineFn returns a value different from the existing value, the path is updated
     */
    unionWith(obj1: any, obj2: any, combineFn: (a: any, b: any) => any) {
        //
        let res = obj1;

        this.forEachValue(obj2, (value, path) => {
            //
            const existing = this.get(obj1, path);

            const combined = combineFn(existing, value);

            if (combined == null) {
                //
                res = this.unset(res, path);
                //
            } else if (combined != existing) {
                //
                res = this.set(res, path, combined);
            }
        });

        return res;
    }

    /**
     * Returns an object whose paths are the union of the paths of obj1 and obj2
     * paths in obj1 take precedence over paths in obj2
     */
    union(obj1: any, obj2: any) {
        //
        return this.unionWith(obj1, obj2, (a, b) => a ?? b);
    }

    /**
     * Returns an object whose paths are the union of the paths of obj1 and obj2
     * paths in obj2 take precedence over paths in obj1
     */
    assign(obj1: any, obj2: any) {
        //
        return this.unionWith(obj1, obj2, (a, b) => b ?? a);
    }

    /**
     * Removes from obj1 the paths that are present in obj2
     */
    substract(obj1: any, obj2: any) {
        //
        let res = obj1;

        this.forEachValue(obj2, (value, path) => {
            //
            if (value == null) return;

            res = this.unset(res, path);
            //
        });

        return res;
    }

    /**
     * Returns from obj1 the paths that are present in obj2
     */
    extract(obj1: any, obj2: any) {
        //
        const paths = this.paths(obj2);

        return this.onlyPaths(obj1, paths);
    }

    /**
     * Removes from obj1 the paths that are present in obj2 AND have the same value
     */
    overrides(obj1: any, obj2: any) {
        //
        let res = obj1;

        this.forEachValue(obj2, (value, path) => {
            //
            if (value == null) return;

            const existing = this.get(obj1, path);

            if (existing == value) {
                //
                res = this.unset(res, path);
            }
        });
    }

    withoutPaths(obj: any, paths: string[]) {
        //
        let res = obj;

        paths.forEach((path) => {
            //
            res = this.unset(res, path);
        });

        return res;
    }

    onlyPaths(obj: any, paths: string[]) {
        //
        let res = {};

        paths.forEach((path) => {
            //
            const value = this.get(obj, path);

            if (value != null) {
                res = this.set(res, path, value);
            }
        });

        return res;
    }
}
