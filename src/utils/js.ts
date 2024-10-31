import { XYZ } from "engine/@types/types";
import { Quaternion } from "three";

export const hasOwn: (typeof Object)["hasOwn"] =
  Object.hasOwn ??
  function (obj: object, key: PropertyKey) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  };

export function isObject(item) {
  return item && typeof item === "object" && !Array.isArray(item);
}

export function isPrimitive(obj) {
  return obj !== Object(obj);
}

export function removeItem(arr: Array<unknown>, el: unknown) {
  //
  const index = arr.indexOf(el);

  if (index >= 0) {
    arr.splice(index, 1);
  }

  return index;
}

export function upgradeData(data: any, defData: any) {
  //
  Object.keys(defData).forEach((key) => {
    //
    const defVal = defData[key];

    if (!hasOwn(data, key)) {
      //
      data[key] = defVal;

      return;
    }

    const val = data[key];

    if (isObject(val) && isObject(defVal)) {
      //
      upgradeData(val, defVal);
    }
  });

  // for (let key in data) {
  //     if (!hasOwn(defData, key)) {
  //         delete data[key];
  //     }
  // }

  return data;
}

export function deepEqual(x, y) {
  //
  if (x === y || (x == null && y == null)) {
    return true;
  }

  if (isPrimitive(x) && isPrimitive(y)) {
    return x === y;
  }

  if (Array.isArray(x) && Array.isArray(y)) {
    return x.length === y.length && x.every((it, i) => deepEqual(it, y[i]));
  }

  if (x == null || y == null) return false;

  if (Object.keys(x).length !== Object.keys(y).length) return false;

  // compare objects with same number of keys
  const keys = Object.keys(x);
  for (let key of keys) {
    if (!(key in y)) return false; //other object doesn't have this prop
    if (!deepEqual(x[key], y[key])) return false;
  }

  return true;
}

export function closeTo(a: number, b: number, epsilon = 0.001) {
  //
  return Math.abs(a - b) < epsilon;
}

export function vec3Eq(a: XYZ, b: XYZ, epsilon = 0.001) {
  //
  return (
    closeTo(a.x, b.x, epsilon) &&
    closeTo(a.y, b.y, epsilon) &&
    closeTo(a.z, b.z, epsilon)
  );
}

export function quaternionEq(a: Quaternion, b: Quaternion, epsilon = 0.001) {
  //
  return vec3Eq(a, b, epsilon) && closeTo(a.w, b.w, epsilon);
}

export function copyXYZ(source: any, target: any) {
  //
  if (source == null || target == null) return null;

  if (source.x != null && target.x != null) target.x = source.x;
  if (source.y != null && target.y != null) target.y = source.y;
  if (source.z != null && target.z != null) target.z = source.z;

  return target;
}

export function cloneXYZ(source: XYZ) {
  return { x: source.x, y: source.y, z: source.z };
}

export function capitalize(val: string): string {
  return val.charAt(0).toUpperCase() + val.slice(1);
}

/**
 * Generate new unique id with prefix, ie `prefix1`, `prefix2`, etc.
 */
export function newIncId(
  prefix: string,
  items: string[] | Record<string, any>
) {
  //
  let id = 1;

  const keyMap: Record<string, any> = Array.isArray(items)
    ? items.reduce((acc, it) => {
        acc[it] = true;
        return acc;
      }, {} as any)
    : items;

  while (keyMap[`${prefix}${id}`]) {
    id++;
  }

  return `${prefix}${id}`;
}

export type Result<T> =
  | { type: "Success"; value: T }
  | { type: "Fail"; error: string };

export function Success<T>(value: T): Result<T> {
  return { type: "Success", value };
}

export function Fail<T>(error: string): Result<T> {
  return { type: "Fail", error };
}

export function withTimeout<T>(
  promise: Promise<T>,
  timeout: number
): Promise<T> {
  //
  const timeoutPromise = new Promise<T>((_, reject) => {
    setTimeout(() => {
      reject("Timeout");
    }, timeout);
  });

  return Promise.race([promise, timeoutPromise]);
}

export const LOAD_TIMEOUT = 60_000;

export async function hash(data: ArrayBuffer | string | object) {
  //
  let buffer = data instanceof ArrayBuffer ? data : strEncode(data);

  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);

  const hashArray = Array.from(new Uint8Array(hashBuffer));

  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex;
}

/**
 * A deterministic version of JSON.stringify that produces the same
 * string regardless of the order of keys in the object
 */
export function stableStringify(jsonObj: any) {
  //
  return JSON.stringify(sortObject(jsonObj));
}

function sortObject(obj) {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortObject);
  }

  return Object.keys(obj)
    .sort()
    .reduce((result, key) => {
      result[key] = sortObject(obj[key]);
      return result;
    }, {});
}

export function strEncode(str: string | object) {
  //
  let enc = new TextEncoder();

  return typeof str === "string"
    ? enc.encode(str)
    : enc.encode(stableStringify(str));
}
