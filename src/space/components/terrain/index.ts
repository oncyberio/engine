import { DefaultComponentFactory } from "engine/abstract/defaultcomponentfactory";
import { TerrainComponent } from "./terraincomponent";
import { MODES, SHADERS, presetImages, TERRAIN_SHAPES } from "./data";

export class TerrainComponentFactory extends DefaultComponentFactory<TerrainComponent> {
  //
  Type = TerrainComponent;

  static info = {
    type: "terrain",
    title: "Terrain",
    image:
      "https://res.cloudinary.com/ugc-oo-oo/image/upload/v1722271320/290724-terrain.jpg",
    help: {
      desc: "Build a terrain",
    },
    batchDraw: false,
    draggable: true,
  };

  static {
    //
    const defaultData = {
      id: `terrain-${Date.now()}`,

      kit: "cyber",

      type: "terrain",

      position: { x: 0, y: 0, z: 0 },

      rotation: { x: 0, y: 0, z: 0 },

      scale: { x: 1000, y: 150, z: 1000 },

      color: "#bbbbbb",

      noiseEnabled: false,

      definition: 100,

      seed: 4321,

      noiseDomain: 5,

      smoothCenter: 0.5,

      smoothLength: 0.1,

      islandSmooth: 1,

      islandLength: 0.1,

      innerRadius: 0,

      textureOpts: presetImages.wooden,

      tiles: 20,

      mode: MODES.shader,

      shader: SHADERS.grid,

      shape: TERRAIN_SHAPES.plane,

      griddiv: 180,

      edgeTransition: 5,

      noTileDisplacement: 1,

      smoothAngle: 0.7,

      visibleOnOcclusion: true,

      textureSideOpts: presetImages.grass,

      collider: {
        enabled: true,
        rigidbodyType: "FIXED",
        type: "MESH",
      },
    };

    this.createDataWrapper({
      defaultData,
    });
  }
}
