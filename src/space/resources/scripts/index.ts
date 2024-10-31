import { ScriptEvents } from "./api/scriptevents";
import * as anime from "animejs/lib/anime.es.js";
import * as THREE from "three";
import * as globals from "./api/globals";
import * as scriptComponents from "./api/scriptparams";
import Camera from "engine/camera";
import Controls from "engine/components/controls";
import { ScriptResource } from "./scriptresource";
import { CreateOpts, ResourceFactory } from "../resourcefactory";
import { ScriptEmitter } from "./api/scriptemitter";
import { GameTimer } from "./api/gametimer";
import { createScriptComponentFactory } from "./scriptfactory/createComponentFactory";
import { ScriptResourceData } from "./scriptdata";

const libsNS = {
  OO_SCRIPTING: "@oo/scripting",
  OO_SCRIPTING_COMPONENTS: "@oo/scripting/components",
  ANIME: "animejs",
  RAPIER: "@dimforge/rapier3d",
  THREE: "three",
};

type ScriptResDict = Record<string, ScriptResource>;

export class ScriptResourceFactory extends ResourceFactory<ScriptResource> {
  //
  /**
   * Modules are scripts added by the game. We need to evaluate them before we
   * can get their exports
   */
  private scriptModules: Record<string, ScriptResource> = {};

  private imports: Record<string, any> = {};

  /**
   * modules exports are stored here
   */
  private modulesByUri: ScriptResDict = {};

  private modulesById: ScriptResDict = {};

  emitter: ScriptEmitter;

  async init() {
    //
    this.emitter = new ScriptEmitter();

    this.emitter.on("GAME_READY", () => {
      this.opts.space.physics.active = true;
    });

    this.emitter.init();

    const prelude = this.initPrelude();

    Object.assign(this.imports, prelude);
  }

  async resolve(resources: ScriptResource[]) {
    //
    resources.forEach((mod) => {
      //
      this.runModule(mod);
    });
  }

  getComponentFactory(script: ScriptResource) {
    //
    if (!script.hasComponentFactory) {
      //
      throw new Error(`Script ${script.data.uri} is not a component`);
    }

    return createScriptComponentFactory(script);
  }

  // private _stack: ScriptResource[] = [];

  private runModule(script: ScriptResource) {
    //
    script.runModule();

    this.imports[script.data.uri] = script.exports;

    return script.exports;
  }

  initPrelude() {
    //
    const prelude = {
      [libsNS.OO_SCRIPTING]: {},
      [libsNS.OO_SCRIPTING_COMPONENTS]: {},
      [libsNS.ANIME]: anime,
      [libsNS.RAPIER]: this.opts.space.physics.RAPIER,
      [libsNS.THREE]: THREE,
    };

    const ooScriptingApi = {
      ...globals,
      World: this.opts.space,
      Components: this.opts.space.components,
      Physics: this.opts.space.physics,
      Camera: Camera.current,
      Controls,
      Emitter: this.emitter,
      Events: ScriptEvents,
      Timer: new GameTimer(this.emitter),
    };

    Object.keys(this.opts.externalApi).forEach((key) => {
      //
      if (key === libsNS.OO_SCRIPTING) {
        Object.assign(ooScriptingApi, this.opts.externalApi[key]);
      } else {
        prelude[key] = this.opts.externalApi[key];
      }
    });

    prelude[libsNS.OO_SCRIPTING] = ooScriptingApi;

    prelude[libsNS.OO_SCRIPTING_COMPONENTS] = scriptComponents;

    if (process.env.NODE_ENV === "development") {
      //
      globalThis["ooScripting"] = prelude[libsNS.OO_SCRIPTING];
    }

    return prelude;
  }

  require = (uri: string) => {
    //
    let imp = this.imports[uri];

    if (imp == null) {
      //
      let script = this.scriptModules[uri];

      if (script == null) {
        console.error(`Module ${uri} not found`);
        return {};
      }

      imp = this.runModule(script);
    }

    return imp;
  };

  async createResource(data: ScriptResourceData): Promise<ScriptResource> {
    //
    if (this.scriptModules[data.uri]) {
      //
      throw new Error(`ScriptModule with uri ${data.uri} already exists`);
    }

    // if (data.external) {
    //     //
    //     source = await fetch(data.emit?.code).then((res) => res.text());
    // }

    const module = new ScriptResource({
      factory: this,
      data,
    });

    this.scriptModules[data.uri] = module;

    this.modulesByUri[data.uri] = module;

    this.modulesById[data.id] = module;

    return module;
  }

  async updateResource(
    script: ScriptResource,
    data: ScriptResourceData
  ): Promise<ScriptResource> {
    //

    const prevUri = script.data.uri;

    delete this.imports[prevUri];

    script._patch({
      data,
    });

    if (prevUri !== script.data.uri) {
      //
      this.scriptModules[script.data.uri] = script;

      this.modulesByUri[script.data.uri] = script;

      delete this.scriptModules[prevUri];

      delete this.modulesByUri[prevUri];
    }

    return script;
  }

  destroyResource(module: ScriptResource): void {
    //
    delete this.scriptModules[module.data.uri];

    delete this.modulesByUri[module.data.uri];

    delete this.modulesById[module.data.id];

    module.onDispose();
  }

  getModuleByUri(uri: string) {
    //
    return this.modulesByUri[uri];
  }

  getModuleById(id: string) {
    //
    return this.modulesById[id];
  }

  findModule(fn: (module: ScriptResource) => boolean) {
    //
    return Object.values(this.scriptModules).find(fn);
  }

  getMainModule() {
    //
    return Object.values(this.scriptModules).find((mod) => mod.isMain);
  }

  canDestroy(resource: ScriptResource) {
    //
    return !Object.values(this.scriptModules).some((mod) =>
      mod.dependsOn(resource)
    );
  }
}
