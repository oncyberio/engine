import type { Space } from "engine/space/wrapper";
import type { ResourceData } from "./resource";
import type { ResourceManager } from "./resourcemanager";

export interface ResourceFactoryOpts {
    kits: Record<string, any>;
    space: Space;
    externalApi: Record<string, any>;
    data: Record<string, ResourceData<any>>;
}
