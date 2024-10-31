import { LinearFilter, Texture, SRGBColorSpace, AudioLoader } from "three";
import { PMREMGenerator } from "engine/utils/pmremgenerator.js";
import { TargetedDracoLoader } from "engine/loaders/dracoloader";
import { GLTFLoader } from "engine/loaders/GLTFLoader";
import { CHECK_ABORT_SIGNAL, REJECT_IF_ABORTED } from "engine/utils/abort";
import {
  BITMAP_SUPPORT,
  WEB_WORKER_SUPPORT,
  IS_MOBILE,
  FBO_DEBUG,
  DEBUG,
  SET_COMPRESSED_SUPPORT,
  IS_DESKTOP,
} from "engine/constants";
import WorkerPool from "engine/utils/workerpool.js";
import WorkerSource from "engine/worker/image.worker.js";
import { cloudinary, fetchUrl } from "engine/utils/urlutils.ts";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import renderer from "./renderer";
import { KTX2Loader } from "engine/utils/KTX2Loader";
import { Assets } from "./assets";

class Loader {
  constructor() {
    this.workerPool = null;

    if (WEB_WORKER_SUPPORT) {
      this.workerPool = new WorkerPool(WorkerSource, IS_MOBILE ? 4 : 8);
    }

    // GLTF

    this.gltfLoader = new GLTFLoader().setCrossOrigin("anonymous");

    this.dracoLoader = new TargetedDracoLoader();

    this.dracoLoader.setDecoderConfig({});

    this.dracoLoader.setDecoderPath(Assets.js.draco);

    this.gltfLoader.setDRACOLoader(this.dracoLoader);

    this.audioLoader = new AudioLoader();

    this.bitmapOptions = {
      imageOrientation: /** @type {const} */ ("flipY"),
    };

    this.rgbeLoader = new RGBELoader();
  }

  async addKTX() {
    // dont use on desktop
    if (IS_DESKTOP == true) return;

    // build a compressed support before loading the ktx2 loader
    // to detect first if its worth it

    this.ktxLoader = new KTX2Loader();

    this.ktxLoader
      .setTranscoderPath(Assets.js.basis)
      .detectSupport(renderer, DEBUG);

    SET_COMPRESSED_SUPPORT(this.ktxLoader.workerConfig);

    this.gltfLoader.setKTX2Loader(this.ktxLoader);
  }

  async loadGLTF(url) {
    if (__BUILD_TARGET__ === "web") {
      const data = await fetchUrl(url).then(async (res) => {
        //
        if (res.ok) {
          //
          return res.arrayBuffer();
        }

        return Promise.reject("Failed to load gltf at" + url);
      });

      return new Promise(async (resolve, reject) => {
        var gltf = await this.parseGLTF(data);

        gltf.rawBuffer = data;

        resolve(gltf);
      });
    }

    if (__BUILD_TARGET__ === "node") {
      const data = await fetch(url).then((res) => res.arrayBuffer());

      return new Promise((resolve, reject) => {
        this.gltfLoader.parse(
          data,
          "",
          (gltf) => {
            // debugger
            // console.log("gltf", gltf)

            gltf.rawBuffer = data;
            globalThis.gltf = gltf;
            resolve(gltf);
          },
          (err) => {
            // debugger

            reject(err);
          }
        );
      });
    }
  }

  async parseGLTF(rawBuffer) {
    return this.gltfLoader.parseAsync(rawBuffer, "");
  }

  async loadImage(url, abort) {
    CHECK_ABORT_SIGNAL(abort);

    return new Promise(async (resolve, reject) => {
      if (WEB_WORKER_SUPPORT) {
        this.workerPool.queueJob(
          "./imageworker.js",

          {
            url: url,

            imageOrientation: this.bitmapOptions.imageOrientation,

            bitmap: BITMAP_SUPPORT,
          },

          (e) => {
            // console.log(e.data)

            if (e.data.cancel) {
              console.log("job killed ");
            }

            // console.log("LODMesh worker callback", name, abort, e)

            if (REJECT_IF_ABORTED(abort, reject)) return;

            if (e.data.error == true) {
              // debugger
              reject("image not found " + url);
            } else {
              if (e.data.blob) {
                var url = URL.createObjectURL(e.data.blob);

                var image = new Image();

                image.crossOrigin = "anonymous";

                image.onload = () => {
                  resolve(image);
                };

                image.onerror = (error) => {
                  console.error(error);
                };

                image.src = url;
              } else {
                const img = e.data.image;

                img.naturalWidth = img.width;

                img.naturalHeight = img.height;

                resolve(img);
              }
            }
          },

          this,

          abort
        );
      } else {
        fetchUrl(url, {
          signal: abort,
        })
          .then(async (response) => {
            // console.log((new Date()).toTimeString(), "LODMesh worker callback", name, abort?.aborted)

            if (REJECT_IF_ABORTED(abort, reject)) return;

            if (!response.ok) {
              reject("not found " + url);

              return;
            }

            const mimeType = response.headers
              .get("Content-Type")
              ?.split(";")[0];

            const isSvg = mimeType.startsWith("image/svg");

            var blob = await response.blob();

            if (REJECT_IF_ABORTED(abort, reject)) return;

            if (!isSvg && BITMAP_SUPPORT) {
              let bmoptions = {
                imageOrientation: this.bitmapOptions.imageOrientation,
              };

              let img = await createImageBitmap(blob, bmoptions);

              if (REJECT_IF_ABORTED(abort, reject)) return;

              // @ts-ignore
              img.naturalWidth = img.width;

              // @ts-ignore
              img.naturalHeight = img.height;

              resolve(img);
            } else {
              let img = new Image();

              img.crossOrigin = "Anonymous";

              img.onload = () => {
                img.onload = null;

                img.onerror = null;

                resolve(img);
              };

              img.onerror = () => {
                img.onload = null;

                img.onerror = null;

                if (REJECT_IF_ABORTED(abort, reject)) return;

                reject("not found " + url);
              };

              img.src = URL.createObjectURL(blob);
            }
          })

          .catch((error) => {
            if (REJECT_IF_ABORTED(abort, reject)) return;

            reject(error);
          });
      }
    });
  }

  async loadTexture(url) {
    //
    const image = await this.loadImage(url);

    var tex = new Texture();

    tex.image = image;

    tex.needsUpdate = true;

    return tex;
  }

  async loadRawImage(url) {
    const image = await this.loadImage(url);

    return image;
  }

  isLoading = {};

  async loadSharedTexture(url) {
    if (this.isLoading[url] != null) {
      await this.isLoading[url].promise;

      return this.isLoading[url].content;
    } else {
      var r = null;
      var p = new Promise((resolve) => {
        r = resolve;
      });

      this.isLoading[url] = {
        promise: p,
      };

      const image = await this.loadImage(url);

      var tex = new Texture();

      tex.image = image;

      tex.needsUpdate = true;

      this.isLoading[url].content = tex;

      r();

      return tex;
    }
  }
  /**
   *
   * @param { string } path
   * @returns { Promise<{ texture: DataTexture; texData: object }> }
   */
  async loadRGBE(path) {
    var blobURL = path;

    var previouslyAblob = false;

    const response = await fetchUrl(path);
    const buffer = await response.arrayBuffer();
    const type = response.headers.get("content-type")?.split(";")[0];
    blobURL = URL.createObjectURL(new Blob([buffer], { type }));

    return new Promise((resolve, reject) => {
      this.rgbeLoader.load(
        blobURL,
        (texture, texData) => {
          if (previouslyAblob == false) {
            URL.revokeObjectURL(blobURL);
          }
          resolve({ texture, texData });
        },
        undefined,
        (err) => {
          if (previouslyAblob == false) {
            URL.revokeObjectURL(blobURL);
          }
          reject(err);
        }
      );
    });
  }

  async loadCubeImage(source) {
    let background;

    if (
      source?.format?.toLowerCase() == ".jpg" ||
      source?.format?.toLowerCase() == ".jpeg" ||
      source?.format?.toLowerCase() == ".png"
    ) {
      var tex = new Texture();

      var img = new Image();

      img.crossOrigin = "Anonymous";

      var url = source.image;

      if (IS_MOBILE) {
        url = cloudinary.res(source.image, 2048);
      }

      var tex = await this.loadTexture(url);

      tex.colorSpace = SRGBColorSpace;

      tex.minFilter = LinearFilter;

      tex.needsUpdate = true;

      background = await this.loadPMREMEnvironment(source, true, tex);

      background.sharp = tex;
    }

    // if hdr
    else {
      background = await this.loadPMREMEnvironment(source, true);
    }

    return background;
  }

  async loadCubeMapFromScene(scene, flipY = false, opts) {
    if (this.pmremGenerator == null) {
      this.pmremGenerator = new PMREMGenerator(await this.getRenderer());
    }

    this.pmremGenerator.compileCubemapShader();

    // legacy
    // scene.children.forEach((child) => {
    //     if (child.name === "artwork") {
    //         child.visible = false;
    //     }
    // });

    let envMap = this.pmremGenerator.fromScene(scene, 0, 0.01, 5000, opts);

    // @ts-ignore
    envMap.flipY = false;

    // legacy
    // scene.children.forEach((child) => {
    //     if (child.name === "artwork") {
    //         child.visible = true
    //     }
    // })

    // @ts-ignore
    envMap.texture.renderTarget = envMap;

    this.pmremGenerator.dispose();

    return envMap;
  }

  // pmremCache = {};

  /**
   *
   * @param { import('@gltypes').EnvironmentParams} environment
   * @returns { Promise<Texture> }
   */
  async loadPMREMEnvironment(environment, flipY = false, tex = null) {
    // console.log("loadPMREMEnvironment flipY", !!flipY)

    if (!environment.path) return null;

    // if (this.pmremCache[environment.path] != null) {
    //     console.log(
    //         "loadPMREMEnvironment found in cache",
    //         environment.path,
    //     );

    //     return this.pmremCache[environment.path];
    // }

    console.log("loadPMREMEnvironment not found in cache", environment.path);

    return this._loadPMREMEnvironmentNoCache(environment, flipY, tex);
  }

  async _loadPMREMEnvironmentNoCache(environment, flipY = false, tex = null) {
    if (this.pmremGenerator == null) {
      this.pmremGenerator = new PMREMGenerator(await this.getRenderer());
    }

    this.pmremGenerator.compileEquirectangularShader();

    if (tex == null) {
      const { texture } = await this.loadRGBE(environment.path);
      texture.flipY = flipY;

      tex = texture;
    }

    tex.needsUpdate = true;

    if (FBO_DEBUG) {
      if (this.fboHelper == null) {
        this.fboHelper = (await import("engine/globals/fbohelper.js")).default;
      }

      this.fboHelper.attach(tex, "tex" + Math.random());
    }

    // const { texture } = await this.loadRGBE(environment.path);
    // texture.flipY = flipY

    const temp = this.pmremGenerator.fromEquirectangular(tex);

    // console.log(tem)

    // @ts-ignore
    temp.texture.renderTarget = temp;

    let envMap = temp.texture;

    envMap.magFilter = LinearFilter;

    envMap.userData.isShared = true;

    if (FBO_DEBUG) {
      if (this.fboHelper == null) {
        this.fboHelper = (await import("engine/globals/fbohelper.js")).default;
      }

      this.fboHelper.attach(envMap, "tex" + Math.random());
    }

    return envMap;
  }

  async loadJson(url) {
    const reponse = await fetch(url, {});

    const data = await reponse.json();

    return data;
  }

  /**
   * @param { string } url
   * @returns { Promise<AudioBuffer> }
   */
  async loadAudio(url) {
    return new Promise((resolve, reject) => {
      this.audioLoader.load(url, resolve, () => {}, reject);
    });
  }

  async getRenderer() {
    return renderer;
  }
}

export default new Loader();
