import { ResourceData } from "../resource";

export interface PrefabResourceData extends ResourceData<"prefab"> {
    /**
     * Component type
     */
    type: "prefab";

    template: any;

    parentId: string;

    _index?: number;

    children: Record<string, PrefabResourceData>;

    meta: {
        name?: string;
        title?: string;
        description?: string;
        image?: string;
    };
}
