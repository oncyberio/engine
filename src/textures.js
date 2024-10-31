import Loader from "engine/loader";

import { Texture } from "three";

class Textures {
  constructor() {
    this.promiseList = {};

    this._isLoading = {};
  }

  get_url_extension(url) {
    const cs = url.split(".");

    let ext = cs.pop();

    if (ext === "undefined") {
      ext = cs.pop();
    }

    return ext;
  }

  loadTextures(object) {
    return new Promise((resolve, reject) => {
      var ps = [];

      let i = 0;

      while (i < object.length) {
        let current = object[i];

        const url = current.alternateUrl
          ? [current.url, current.alternateUrl]
          : [current.url];

        const ext = this.get_url_extension(url[0]).toLowerCase();

        const isJPGPNG = ext == "jpg" || ext == "png" || ext == "jpeg";

        if (this[current.name] == null && isJPGPNG == true) {
          ps.push(this.loadOnce(current));
        }

        i++;
      }

      Promise.all(ps).then((res) => {
        resolve(res);

        let i = 0;

        while (i < object.length) {
          this.unlock(object[i].name);

          i++;
        }
      });
    });
  }

  async loadTexture(object) {
    return new Promise((resolve, reject) => {
      if (object.url == null) {
        // debugger;
      }

      Loader.loadTexture(object.url)
        .then((tex) => {
          this.set(object.name, tex);

          resolve(tex);
        })
        .catch((err) => {
          console.error(err);

          const t = new Texture();

          this.set(object.name, t);

          resolve(t);
        });
    });
  }

  async loadOnce(object) {
    if (this._isLoading[object.name] == null) {
      this._isLoading[object.name] = true;

      return this.loadTexture(object);
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

  isLock(name) {
    return this._isLoading[name] != null;
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
    }
  }

  set(name, value) {
    if (this[name] == null) {
      this[name] = value;
    } else {
      console.warn("texture already set");
    }
  }

  remove(name) {
    delete this[name];
    delete this._isLoading[name];
    delete this.promiseList[name];
  }

  getInstance() {
    return new Textures();
  }
}

export default new Textures();
