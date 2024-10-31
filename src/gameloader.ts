import { Engine, Game } from "engine/index";
import { IS_MOBILE } from "engine/constants";
import { components } from "./space/components/components";
import background from "./components/background";

export class GameLoader {
  //

  static _instance: GameLoader = null;

  static getInstance() {
    if (!GameLoader._instance) {
      GameLoader._instance = new GameLoader();
    }

    return GameLoader._instance;
  }

  private mobileResizeTimeout = null;

  private _engine: Engine = Engine.getInstance();

  private _autoResize = false;

  private _loaded = { resolve: null, promise: null as Promise<Engine> };

  constructor() {
    //
    this._loaded.promise = new Promise((resolve) => {
      this._loaded.resolve = resolve;
    });
  }

  get engine() {
    return this._engine;
  }

  setAutoResize(val) {
    //
    if (this._autoResize === val) return;

    this._autoResize = val;

    if (val) {
      window.addEventListener(
        "resize",
        IS_MOBILE ? this._mobileResize : this._resize
      );
      window.addEventListener(
        "change",
        IS_MOBILE ? this._mobileResize : this._resize
      );

      this._resize();
    } else {
      window.removeEventListener(
        "resize",
        IS_MOBILE ? this._mobileResize : this._resize
      );
      window.removeEventListener(
        "change",
        IS_MOBILE ? this._mobileResize : this._resize
      );
    }
  }

  get Events() {
    return this._engine.Events;
  }

  get APP_STATES() {
    //
    return this._engine?.APP_STATES;
  }

  get loaded() {
    return this._loaded.promise;
  }

  private _mobileResize = () => {
    clearTimeout(this.mobileResizeTimeout);

    this.mobileResizeTimeout = setTimeout(() => {
      this._engine?.resize({
        w: window.innerWidth,
        h: window.innerHeight,
      });
    }, 50);

    this.mobileResizeTimeout = setTimeout(() => {
      this._engine?.resize({
        w: window.innerWidth,
        h: window.innerHeight,
      });
    }, 300);
  };

  private _resize = () => {
    this._engine?.resize({
      w: window.innerWidth,
      h: window.innerHeight,
    });
  };

  private _state = "void";

  get state() {
    //
    return this._state;
  }

  // private _currentOpts: LoadGameOpts = null;

  private _currentAbort: AbortController = null;

  async enterGame(opts) {
    //
    const startTime = Date.now();

    if (this._state != "void") {
      //
      throw new Error("Exit the current game before loading a new one.");
    }

    const abort = (this._currentAbort = new AbortController());

    const signal = this._currentAbort.signal;

    this._state = "loading";

    await this._engine.ready;

    if (signal.aborted) return;

    try {
      //
      this.setAutoResize(opts.autoResize ?? true);

      //opts.callbacks.onProgress(40);

      await this.engine.play();

      await this.engine.setState(this.engine.APP_STATES.INTRO, {});

      if (signal.aborted) return;

      console.log("GameScene: preloading...");

      const engineOpts = {
        ...opts,
      };

      if (signal.aborted) return;

      await this._loadGameInEngine({ opts: engineOpts, signal });

      if (signal.aborted) return;

      console.log("COMPLETE...");

      const endTime = Date.now();

      this._state = "loaded";
      //
    } catch (err) {
      //
      console.error("[GameLoader.enterGame]", err);

      this._state = "void";

      throw err;
      //
    } finally {
      //
      if (abort === this._currentAbort) {
        //
        this._currentAbort = null;
      }
    }
  }

  async exitGame() {
    //
    if (this._state === "void") {
      //
      throw new Error("No game is currently loaded.");
    }

    this._currentAbort?.abort();

    this._currentAbort = null;

    this._state = "void";

    this._autoResize = false;

    this._engine.setState(this._engine.APP_STATES.VOID, {});

    await this._engine.pause();
  }

  on(event: string, cb: (...args: any[]) => void) {
    //
    return this._engine?.on(event, cb);
  }

  notify(event: string, data?: any) {
    //
    return this._engine?.notify(event, data);
  }

  private async _loadGameInEngine({
    opts,
    signal,
  }: {
    opts;
    signal: AbortSignal;
  }) {
    //
    const game: Game = {
      id: opts.game.id ?? "game",
      kits: opts.game.kits || {},
      components: structuredClone(opts.game.components),
    };

    opts.game.params = {
      ...(opts.game.params || {}),
    };

    let externalApi = this.initApi({ ...opts, engine: this.engine });

    this.engine.setEditMode(false);

    await this.engine.showIntro();

    await this.engine.setState(this.engine.APP_STATES.GAME, {
      game,
      externalApi,
      signals: opts.signals,
      loadOpts: {
        looseMode: !!opts.game.params?.looseMode,
      },
    });

    if (signal.aborted) return;

    if (signal.aborted) return;

    this.engine.once(this.engine.Events.GAME_POST_READY, async () => {
      await this.engine.hideIntro();
    });

    this.engine.notify(this.engine.Events.GAME_READY);
  }

  loadDemoScene() {
    //
    return this.enterGame({
      game: demoScene,
    });
  }

  initApi(opts) {
    //

    return {
      "@oo/scripting": {
        ...(opts.api || {}),
      },
    };
  }

  startGame() {
    //
    return this.engine.notify("GAME_START");
  }

  pauseGame() {
    //
    return this.engine.notify("GAME_NOTIFY_PAUSE");
  }

  resumeGame() {
    //
    return this.engine.notify("GAME_NOTIFY_RESUME");
  }
}

const demoScene = {
  id: "demo",
  components: {
    "model-sLLyY93sRa3vK9OmiAOd1": {
      id: "model-sLLyY93sRa3vK9OmiAOd1",
      name: "Building_03",
      mime_type: "model/gltf-binary",
      type: "model",
      url: "https://res.cloudinary.com/ugc-oo-oo/raw/upload/v1708427237/Building_03-high.glb",
      optimized: {
        high: "https://res.cloudinary.com/ugc-oo-oo/raw/upload/v1708427237/Building_03-high.glb",
        low: "https://res.cloudinary.com/ugc-oo-oo/raw/upload/v1708427269/Building_03-low.glb",
        low_compressed:
          "https://res.cloudinary.com/ugc-oo-oo/raw/upload/v1708427273/Building_03-low_compressed.glb",
      },
      collider: {
        enabled: true,
        colliderType: "MESH",
        rigidbodyType: "FIXED",
      },
      position: {
        x: 47.19483630388527,
        y: 1.4519767694034371,
        z: 43.909759369869626,
      },
      rotation: {
        x: 0,
        y: 0,
        z: 0,
      },
      scale: {
        x: 0.07160883871652544,
        y: 0.07160883871652544,
        z: 0.07160883871652544,
      },
      enableAnimation: false,
      kit: "cyber",
      envmap: "scene",
      envmapIntensity: 1,
      animations: {},
      meta: {
        addedBy: "",
        placeholder: "",
      },
      renderMode: "default",
      opacity: 1,
      enableRealTimeShadow: false,
      useTransparency: false,
      center: true,
    },
    fog: {
      fadeColor: "#054d73",
      far: 500,
      kit: "cyber",
      id: "fog",
      near: 300,
      type: "fog",
      enabled: true,
    },

    "mesh-WbyNZ5YxK23T2v-F_R47l": {
      type: "mesh",
      kit: "cyber",
      comment: "",
      renderMode: "default",
      geometry: {
        type: "box",
        boxParams: {},
        sphereParams: {
          radius: 1,
          widthSegments: 32,
          heightSegments: 32,
        },
        cylinderParams: {
          radiusTop: 1,
          radiusBottom: 1,
          height: 1,
          radialSegments: 32,
          heightSegments: 1,
          openEnded: false,
        },
      },
      color: "#ff0000",
      opacity: 1,
      rotation: {
        x: 0,
        y: 0,
        z: 0,
      },
      display: true,
      displayInEditor: true,
      id: "mesh-WbyNZ5YxK23T2v-F_R47l",
      scale: {
        x: 1,
        y: 0.2,
        z: 1,
      },
      collider: {
        enabled: true,
        rigidbodyType: "FIXED",
        colliderType: "MESH",
        sensor: false,
        dynamicProps: {
          mass: 1,
          friction: 0.5,
          restitution: 0,
        },
      },
      name: "Platform",
      script: {
        tag: "plt",
        identifier: "platform",
      },
      _version: 1730181616606,
      position: {
        x: 45.98390492899647,
        y: 2.6884155037138333,
        z: 53.53310972497456,
      },
    },

    "mesh-Siw0uKwB-tn00UT4T6ubY": {
      type: "mesh",
      kit: "cyber",
      comment: "",
      renderMode: "default",
      color: "#ff0000",
      opacity: 1,
      rotation: {
        x: 0,
        y: 0,
        z: 0,
      },
      display: true,
      displayInEditor: true,
      id: "mesh-Siw0uKwB-tn00UT4T6ubY",
      geometry: {
        boxParams: {},
        sphereParams: {
          radius: 1,
          widthSegments: 32,
          heightSegments: 32,
        },
        cylinderParams: {
          radiusTop: 1,
          radiusBottom: 1,
          height: 1,
          radialSegments: 32,
          heightSegments: 1,
          openEnded: false,
        },
        type: "sphere",
      },
      position: {
        x: 50,
        y: 2.8,
        z: 44.7658,
      },
      name: "Ball",
      collider: {
        enabled: true,
        colliderType: "MESH",
        sensor: false,
        rigidbodyType: "DYNAMIC",
        dynamicProps: {
          friction: 0.5,
          restitution: 0,
          mass: 1,
        },
      },
      _version: 1730296972367,
      scale: {
        x: 0.266253502678779,
        y: 0.266253502678779,
        z: 0.266253502678779,
      },
    },
    background: {
      id: "background",
      colorOpts: {
        color: "#000000",
      },
      textureOpts: {
        skyOpts: {
          elevation: 2,
          turbidity: 10,
          mieCoefficient: 0.005,
          rayleigh: 3,
          azimuth: 180,
          mieDirectionalG: 0.7,
        },
        textureType: "Image",
        imageOpts: {
          image: {
            path: "https://cyber.mypinata.cloud/ipfs/QmUk7Hh4EPpMwEtj78WR222UjRNPspbWx71cvWorKWyntU?filename=home_skybox_opt_01.jpg.jpg",
            image:
              "https://cyber.mypinata.cloud/ipfs/QmUk7Hh4EPpMwEtj78WR222UjRNPspbWx71cvWorKWyntU?filename=home_skybox_opt_01.jpg.jpg",
            format: ".jpg",
            name: "home_skybox_opt_01.jpg",
            id: "custom",
            mimeType: "image/jpeg",
          },
        },
      },
      kit: "cyber",
      type: "background",
      _version: 1720732554484,
      backgroundType: "Texture",
    },
    envmap: {
      id: "envmap",
      envmapType: "scene",
      kit: "cyber",
      type: "envmap",
      sceneOpts: {
        position: {
          x: 0,
          y: 0,
          z: 0,
        },
      },
      imageOpts: {
        image: {
          image:
            "https://cyber.mypinata.cloud/ipfs/QmdsiCH8sZqaMhqVCwPWNGn22adEwKMVXGFxFo4panQQoa?filename=studio_nrfv4q.png",
          path: "https://cyber.mypinata.cloud/ipfs/Qmf36ZrHWzbgjvBM1MpvueR6sLaJb1zDTy7tHCjQD1RfKS?filename=studio_lvbl2a.hdr",
          name: "Studio",
          format: ".hdr",
          id: "studio",
        },
      },
    },

    lighting: {
      id: "lighting",
      intensity: 1,
      lightDirection: {
        x: -1,
        y: -0.47,
        z: 0.18,
      },
      lightPosition: {
        x: 400,
        y: 133.40000000000006,
        z: -75,
      },
      size: 500,
      far: 513,
      kit: "cyber",
      bias: -0.002,
      near: 139.4,
      type: "lighting",
      _version: 1720732826855,
      enabled: true,
    },

    spawn: {
      id: "spawn",
      renderMode: "default",
      plugins: [],
      kit: "cyber",
      rotation: {
        x: 0,
        y: 0,
        z: 0,
      },
      scale: {
        x: 1,
        y: 1,
        z: 1,
      },
      type: "spawn",
      useMixer: false,
      defaultAvatar: {
        $$paramType: "resource",
        name: "Summer",
        url: "https://cyber.mypinata.cloud/ipfs/QmQdEGgHE75rtiC3rppPnbmPauVG7qMiaB6wFdu9aobp9R?filename=sunshine.glb",
      },
      useUserAvatar: false,
      position: {
        x: 50,
        y: 3,
        z: 50,
      },
      _version: 1730099915316,
    },
    "terrain-1708966759957": {
      id: "terrain-1708966759957",
      shader: "grid",
      smoothLength: 0.1,
      edgeTransition: 5,
      seed: 4321,
      color: "#08ba85",
      scale: {
        x: 1000,
        y: 150,
        z: 1000,
      },
      noTileDisplacement: 1,
      textureSideOpts: {
        image:
          "https://cyber.mypinata.cloud/ipfs/QmfURY8crGAHcyWh5fi3iZ3QojqL5zHdKa2NbyBf6X18c2?filename=ground_grass_gen_01_mrbton.jpg",
        path: "https://cyber.mypinata.cloud/ipfs/QmfURY8crGAHcyWh5fi3iZ3QojqL5zHdKa2NbyBf6X18c2?filename=ground_grass_gen_01_mrbton.jpg",
        name: "Grass",
        format: ".jpg",
        id: "grass",
      },
      type: "terrain",
      mode: "texture",
      tiles: 20,
      kit: "cyber",
      definition: 100,
      innerRadius: 0,
      _version: 1720732699725,
      visibleOnOcclusion: true,
      collider: {
        rigidbodyType: "FIXED",
        type: "MESH",
        enabled: true,
      },
      shape: "plane",
      rotation: {
        x: 0,
        y: 0,
        z: 0,
      },
      smoothAngle: 0.7,
      islandSmooth: 1,
      griddiv: 180,
      collision: true,
      textureOpts: {
        path: "https://cyber.mypinata.cloud/ipfs/QmTAgRNRm6kTKr8fhTFDWPu8c2PSLUVF6qViBx3xnKeYLi?filename=ScaleTexture_A_100mm_RAL90103jpg.jpg.jpg",
        image:
          "https://cyber.mypinata.cloud/ipfs/QmTAgRNRm6kTKr8fhTFDWPu8c2PSLUVF6qViBx3xnKeYLi?filename=ScaleTexture_A_100mm_RAL90103jpg.jpg.jpg",
        format: ".jpg",
        name: "ScaleTexture_A_100mm_RAL90103jpg.jpg",
        id: "custom",
        mimeType: "image/jpeg",
      },
      smoothCenter: 0.5,
      noiseDomain: 5,
      islandLength: 0.1,
      noiseEnabled: true,
      position: {
        x: 0,
        y: -0.014130147652585467,
        z: 0,
      },
    },
  },
};
