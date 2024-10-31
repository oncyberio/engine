import { Group } from "three";

export default class AugmentedGroup extends Group {
  constructor() {
    super();

    this._mapEvent = {};
  }

  hasListeners(type) {
    return this._mapEvent[type] != null;
  }

  on(name, callback) {
    if (this._mapEvent[name] == null) {
      this._mapEvent[name] = [];
    }

    this._mapEvent[name].push(callback);
  }

  once(name, callback) {
    const oncecallback = (...args) => {
      callback(...args);

      Promise.resolve().then(() => {
        this.off(name, oncecallback);
      });
    };

    this.on(name, oncecallback);
  }

  off(name, callback) {
    if (this._mapEvent[name] == null) {
      console.log("API : does not exist");

      return;
    }

    let i = 0;

    while (i < this._mapEvent[name].length) {
      let curr = this._mapEvent[name][i];

      if (curr == callback) {
        this._mapEvent[name].splice(i, 1);

        if (this._mapEvent[name].length == 0) {
          this._mapEvent[name] = null;

          delete this._mapEvent[name];
        }

        return;
      }

      i++;
    }
  }

  emit(name, ...args) {
    if (this._mapEvent[name] != null && this._mapEvent[name].length) {
      let i = 0;

      let length = this._mapEvent[name].length;

      while (i < length) {
        this._mapEvent[name][i](...args);

        i++;
      }
    }
  }
}
