export interface Deferred<T> {
  promise: Promise<T>;
  resolve: (t: T) => void;
  reject: (reason: any) => void;
}

export function deferred<T>(): Deferred<T> {
  let resolveFn: (t: T) => void;
  let rejectFn: (reason: any) => void;
  let result = null;

  let promise = new Promise<T>((resolve, reject) => {
    if (result) {
      if (result.success) {
        resolve(result.value);
      } else {
        reject(result.value);
      }
    } else {
      resolveFn = resolve;
      rejectFn = reject;
    }
  });

  return {
    promise,

    resolve(value: T) {
      if (resolveFn != null) {
        resolveFn(value);
      } else {
        result = { success: true, value };
      }
    },

    reject(value: any) {
      if (rejectFn != null) {
        rejectFn(value);
      } else {
        result = { success: false, value };
      }
    },
  };
}
