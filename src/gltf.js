import Loader from "./loader.js";
import { disposeThreeResources } from "engine/utils/dispose";

class GLTF {
  getInstance() {
    return new GLTF();
  }

  constructor() {
    this.promiseList = {};
    this.rawLoadings = {};
    this._isLoading = {};
  }

  loadObject(object) {
    return new Promise((resolve, reject) => {
      let url = object.url;

      const ext = this.get_url_extension(url).toLowerCase();

      // force if object.force or is blob url

      // already loaded in

      if (this[object.name] != null) {
        resolve(this[object.name]);
      } else if (this[object.name] == null) {
        this.loadOnce(object).then((res) => {
          resolve(res);
        }, reject);
      } else {
        console.error("Invalid gltf type ", object);

        reject("Invalid gltf type " + url);
      }
    });
  }

  async load(object) {
    // try {
    // try {
    var res = await Loader.loadGLTF(object.url);

    this.set(object.name, res);
    // } catch (e) {
    //    console.error(e);
    // }
    // } catch (e) {
    // console.error(e);

    // return null;
    // }

    return res;
  }

  async loadOnce(object) {
    if (this._isLoading[object.name] == null) {
      this._isLoading[object.name] = true;

      const res = await this.load(object);

      delete this._isLoading[object.name];

      return res;
    } else {
      // if asking to load a specific model, but already loading somewhere else

      if (this[object.name] == null) {
        const promise = new Promise((resolve) => {
          if (this.promiseList[object.name] == null) {
            this.promiseList[object.name] = [];
          }

          this.promiseList[object.name].push(resolve);
        });

        return promise;
      }

      // already loaded all good
      else {
        return Promise.resolve(this[object.name]);
      }
    }
  }

  async getSingleInstance(url) {
    var res;

    if (this.rawLoadings[url] != null) {
      await this.rawLoadings[url];
    }

    if (this["raw" + url] != null && this["raw" + url].rawBuffer != null) {
      res = await Loader.parseGLTF(this["raw" + url].rawBuffer);
    } else {
      if (this.rawLoadings[url] == null) {
        this.rawLoadings[url] = new Promise(async (resolve) => {
          res = await Loader.loadGLTF(url);

          resolve(res);
        });

        await this.rawLoadings[url];

        this["raw" + url] = res;
      }
    }

    if (res == null) {
      debugger;
    }

    res.userData.vrmExpressionManager = null;

    res.userData.vrm.expressionManager = null;

    return res;
  }

  set(name, value) {
    if (this[name] == null) {
      this[name] = value;
    } else {
      // debugger
      console.warn("gltf already set");
    }
  }

  isLock(name) {
    return this._isLoading[name] != null;
  }

  getLock(name) {
    if (this.promiseList[name]) {
      return this.promiseList[name][0];
    }
  }

  unlock(name) {
    if (this.promiseList[name] != null) {
      let i = 0;

      while (i < this.promiseList[name].length) {
        // execute promise for waiting calls
        this.promiseList[name][i](this[name]);

        i++;
      }

      this.promiseList[name] = null;

      delete this.promiseList[name];
    }
  }

  isValid(url) {
    const ext = this.get_url_extension(url).toLowerCase();

    if (ext == "glb" || ext == "vrm") {
      return true;
    } else {
      return false;
    }
  }

  get_url_extension(url) {
    const cs = url.split(".");

    let ext = cs.pop();

    if (ext === "undefined") {
      ext = cs.pop();
    }

    return ext;
  }

  get(name) {
    if (this[name] != null) {
      return this[name];
    } else {
      console.error(name, "does not exists");
    }
  }

  freeRessource(url) {
    if (this[url] != null) {
      disposeThreeResources(this[url].scene);

      this[url].scene.traverse(function (child) {
        if (child.isMesh) {
          if (child.dispose != null) {
            child.dispose();
          }
        }
      });

      this[url] = null;
    }
  }

  freeAllRessources() {
    for (const key in this) {
      if (Object.hasOwnProperty.call(this, key)) {
        const element = this[key];

        if (element != null && element.scene != null) {
          disposeThreeResources(element.scene);

          element.scene.traverse(function (child) {
            if (child.isMesh) {
              if (child.dispose != null) {
                child.dispose();
              }
            }
          });
        }
      }
    }
  }
}

export default new GLTF();
