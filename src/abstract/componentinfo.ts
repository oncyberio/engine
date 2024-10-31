export type TransformConfigXYZOpt = boolean;

export type TransformConfigOpts =
  | boolean
  | {
      position?: TransformConfigXYZOpt;
      rotation?: TransformConfigXYZOpt;
      scale?: TransformConfigXYZOpt;
    };

export interface ComponentHelp {
  desc?: string;
  tip?: string;
}

export interface ComponentInfo {
  type: string;
  title: string;
  description?: string;
  kit?: string;
  help?: ComponentHelp;
  image: string;
  imageXL?: string;
  group?: string;
  singleton?: boolean;
  required?: boolean;
  draggable?: boolean;
  priority?: number;
  custom?: boolean;
  autoPlace?: boolean;
  transform?: TransformConfigOpts;
  prefab?: boolean;
  batchDraw?: boolean;
  kind?: "script" | "prefab" | undefined;
  initTimeout?: number;
  server?: boolean;
}
