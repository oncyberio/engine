export interface ComponentData<T extends string = any> {
  //
  id?: string;
  kind?: "builtin" | "script";
  name?: string;
  type: T;
  kit?: string;
  parentId?: string;
  children?: Record<string, ComponentData>;
  _index?: number;
  __skipBuild?: boolean;

  attachements?: Record<string, any>;
  //
  [key: string]: any;
}

export interface KitData {
  id: string;
  name: string;
  paths: {
    high: string;
    mid: string;
    low: string;
    low_compressed: string;
    original: string;
  };
}

export interface Game {
  id: string;
  kits: Record<string, KitData>;
  components: Record<string, ComponentData>;
}

import type { ScriptResourceData as SCD } from "engine/space/resources/scripts/scriptdata";

export type ScriptComponentData = SCD;
