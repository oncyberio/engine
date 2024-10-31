//
import { PrefabResourceFactory } from "./prefabs";
import { PrefabResource } from "./prefabs/prefabresource";
import { ResourceFactory } from "./resourcefactory";
import { ScriptResourceFactory } from "./scripts";
import { ScriptResource } from "./scripts/scriptresource";

export const factoryTypeMap: Record<string, typeof ResourceFactory<any>> = {
    script: ScriptResourceFactory,
    prefab: PrefabResourceFactory,
};

export type ResourceByType = {
    script: ScriptResource;
    prefab: PrefabResource;
};
