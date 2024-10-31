// @ts-check

import { BackgroundComponentFactory } from "./background";
import { LightingComponentFactory } from "./lighting";
import { WaterComponentFactory } from "./water";
import { FogComponentFactory } from "./fog";
import { TerrainComponentFactory } from "./terrain";
import { PostProComponentFactory } from "./postprocessing";
import { ReflectorComponentFactory } from "./reflector";
import { RainComponentFactory } from "./rain";
import { EnvmapComponentFactory } from "./envmap";
import { SpawnComponentFactory } from "./spawn";
import { MeshComponentFactory } from "./mesh";
import { ModelComponentFactory } from "./model";
import { TextComponentFactory } from "./text";
import { AudioComponentFactory } from "./audio";
import { ImageComponentFactory } from "./image";
import { VideoComponentFactory } from "./video";
import { DestinationComponentFactory } from "./destination";
import { PortalComponentFactory } from "./portal";
import { KitbashComponentFactory } from "./kitbash";
import { ComponentFactory } from "engine/abstract/componentfactory";
import { AudioComponent } from "./audio/audiocomponent";
import { BackgroundComponent } from "./background/backgroundcomponent";
import { EnvmapComponent } from "./envmap/envmapcomponent";
import { FogComponent } from "./fog/fogcomponent";
import { ImageComponent } from "./image/imagecomponent";
import { LightingComponent } from "./lighting/lightingcomponent";
import { MeshComponent } from "./mesh/meshcomponent";
import { ModelComponent } from "./model/modelcomponent";
import { RainComponent } from "./rain/raincomponent";
import { ReflectorComponent } from "./reflector/reflectorcomponent";
import { SpawnComponent } from "./spawn/spawncomponent";
import { TerrainComponent } from "./terrain/terraincomponent";
import { TextComponent } from "./text/textcomponent";
import { WaterComponent } from "./water/watercomponent";
import { PostProcessingComponent } from "./postprocessing/postprocomponent";
import { KitBashComponent } from "./kitbash/kitbashcomponent";
import { VideoComponent } from "./video/videocomponent";
import { DestinationComponent } from "./destination/destinationcomponent";
import { PortalComponent } from "./portal/portalcomponent";
import { GroupComponentFactory } from "./group";
import { GroupComponent } from "./group/groupcomponent";
import { IframeComponentFactory } from "./iframe";
import { IframeComponent } from "./iframe/iframecomponent";

export const components: Array<typeof ComponentFactory<any>> = [
  KitbashComponentFactory,
  BackgroundComponentFactory,
  LightingComponentFactory,
  WaterComponentFactory,
  FogComponentFactory,
  TerrainComponentFactory,
  PostProComponentFactory,
  ReflectorComponentFactory,
  RainComponentFactory,
  MeshComponentFactory,
  SpawnComponentFactory,
  EnvmapComponentFactory,
  ModelComponentFactory,
  TextComponentFactory,
  AudioComponentFactory,
  ImageComponentFactory,
  VideoComponentFactory,
  DestinationComponentFactory,
  PortalComponentFactory,
  GroupComponentFactory,
  IframeComponentFactory,
];

/**
 * @public
 */
export type ComponentTypeMap = {
  // object: ObjectComponent;
  background: BackgroundComponent;
  lighting: LightingComponent;
  water: WaterComponent;
  fog: FogComponent;
  terrain: TerrainComponent;
  postpro: PostProcessingComponent;
  reflector: ReflectorComponent;
  rain: RainComponent;
  envmap: EnvmapComponent;
  spawn: SpawnComponent;
  mesh: MeshComponent;
  model: ModelComponent;
  text: TextComponent;
  audio: AudioComponent;
  image: ImageComponent;
  video: VideoComponent;
  kitbash: KitBashComponent;
  wave: WaterComponent;
  destination: DestinationComponent;
  portal: PortalComponent;
  group: GroupComponent;
  iframe: IframeComponent;
};

export type CType = keyof ComponentTypeMap;

/**
 * @public
 */
export type CreateComponentArg<T extends CType> = { type: T } & Exclude<
  ComponentTypeMap[T]["data"],
  "type"
>;

export interface ComponentMeta {
  Factory: typeof ComponentFactory;
}

export const componentsMap: Record<string, ComponentMeta> = {};

components.forEach((Type) => {
  const info = Type.info;

  componentsMap[info.type] = {
    Factory: Type,
  };
});
