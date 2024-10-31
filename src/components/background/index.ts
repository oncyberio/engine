import {
  Mesh,
  BoxGeometry,
  Scene,
  SphereGeometry,
  Color,
  Texture,
  ShaderMaterial,
  UniformsUtils,
  ShaderLib,
  BackSide,
  SRGBColorSpace,
  LinearFilter,
} from "three";

import SkyFactory from "engine/components/sky";

import Triangle from "engine/globals/geometries/triangle";

import ColorMaterial from "./materials/color.js";

import SharpMaterial from "./materials/sharp.js";

import PipeLineMesh from "engine/abstract/pipelinemesh";

import Loader from "engine/loader";
import { ColorBackground } from "./colorbackground.js";

import BackdropFactory from "engine/components/backdrop";

let pipeLineOpts = {
  visibleOnOcclusion: false,
  visibleOnMirror: true,
};

export type BackgroundOpts =
  | { type: "color"; color: string }
  | {
      type: "image";
      options: { format: string; image: string; path: string };
    }
  | { type: "sky"; options: any }
  | { type: "backdrop"; options: any };

export type BackgroundMesh = Mesh & {
  getRaw: () => Texture | Color;
  backgroundType: "color" | "image" | "sky";
  updateOpts?: (opts: any) => void;
};

class BackgroundFactory {
  async get(opts: BackgroundOpts): Promise<BackgroundMesh> {
    let mesh: PipeLineMesh;

    let value: Texture | Color;

    if (opts == null) {
      opts = { type: "color" };
    }

    if (opts.type === "color") {
      value = new Color(opts?.color || "#000");

      mesh = new ColorBackground({ color: value, pipeLineOpts });
    } else if (opts.type === "sky") {
      value = await this.loadSky(opts);

      mesh = this.getTextureMesh(value);
    } else if (opts.type === "image") {
      value = await Loader.loadCubeImage(opts.options);

      mesh = this.getTextureMesh(value);
    } else if (opts.type === "backdrop") {
      mesh = await BackdropFactory.get(opts);

      value = await this.loadBackDrop(mesh, opts);
    }

    mesh.matrixAutoUpdate = false;
    mesh.matrixWorldAutoUpdate = false;

    // render background last of opaque render list
    // making sure its always at the back, needs to be rendered before the rest since some of the materials can be additive now..
    // then it needs to add up to the final color..
    mesh.renderOrder = -Infinity;

    mesh.name = "BACKGROUND";

    mesh.frustumCulled = false;

    // @ts-ignore
    mesh.backgroundType = opts.type;

    // @ts-ignore
    mesh.getRaw = function () {
      return value;
    };

    // @ts-ignore
    return mesh;
  }

  getTextureMesh(value) {
    let mesh;

    if (value.sharp) {
      mesh = new PipeLineMesh(
        new SphereGeometry(2, 32, 32),
        new SharpMaterial({
          map: value.sharp,
        }),
        pipeLineOpts
      );

      value.sharp.minFilter = LinearFilter;
      value.sharp.magFilter = LinearFilter;
      value.sharp.generateMipmaps = false;
      value.sharp.needsUpdate = true;

      mesh.geometry.deleteAttribute("normal");

      mesh.scale.z = -1;

      mesh.onBeforeRender = function (renderer, scene, camera) {
        this.matrixWorld.copyPosition(camera.matrixWorld);
      };

      mesh.updateMatrixWorld();
    } else {
      mesh = new PipeLineMesh(
        new BoxGeometry(1, 1, 1),
        new ShaderMaterial({
          name: "BackgroundCubeMaterial",
          transparent: false,
          uniforms: UniformsUtils.clone(ShaderLib.backgroundCube.uniforms),
          vertexShader: ShaderLib.backgroundCube.vertexShader,
          fragmentShader: ShaderLib.backgroundCube.fragmentShader,
          side: BackSide,
          depthWrite: false,

          fog: false,
        }),
        pipeLineOpts
      );

      mesh.geometry.deleteAttribute("normal");

      mesh.geometry.deleteAttribute("uv");

      mesh.onBeforeRender = function (renderer, scene, camera) {
        this.matrixWorld.copyPosition(camera.matrixWorld);
      };

      // add "envMap" material property so the renderer can evaluate it like for built-in materials
      Object.defineProperty(mesh.material, "envMap", {
        get: function () {
          return this.uniforms.envMap.value;
        },
      });

      mesh.material.uniforms.envMap.value = value;

      mesh.material.uniforms.flipEnvMap.value = 1;
    }

    return mesh;
  }

  async loadBackDrop(mesh, opts) {
    const cube = await Loader.loadCubeMapFromScene(mesh, false);

    return cube.texture;
  }

  async loadSky(opts) {
    const skyScene = SkyFactory.get(opts.enableSky, opts.options);

    // console.log(opts.skyOptions)

    // debugger;

    skyScene.rotation.order = "ZYX";

    skyScene.rotation.z = Math.PI / 2;

    skyScene.rotation.x = Math.PI / 2;

    skyScene.updateMatrixWorld(true);

    const cube = await Loader.loadCubeMapFromScene(skyScene, false);

    // @ts-ignore
    cube.sky = true;

    SkyFactory.dispose(skyScene);

    return cube.texture;
  }
}

export default new BackgroundFactory();
