export function startPerf(ts, name) {
  //
  ts[name] = performance.now();
}

export function endPerf(ts, name) {
  //
  ts[name] = performance.now() - ts[name];
}

export const perfs = {
  //
  lastMark: performance.now(),

  marks: {},

  import(obj) {
    Object.assign(perfs.marks, obj);
  },

  mark(name) {
    //
    let now = performance.now();

    perfs.marks[name] = now - perfs.lastMark;

    perfs.lastMark = now;
  },

  log() {
    //
    console.table(perfs.marks);
  },
};

if (typeof window !== "undefined") {
  //
  globalThis["$perfs"] = perfs;
}
