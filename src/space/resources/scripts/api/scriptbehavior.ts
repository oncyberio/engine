import { Component3D } from "engine/abstract/component3D";
import { ScriptComponent } from "./scriptcomponent";

export class ScriptBehavior<
    T extends Component3D = Component3D,
> extends ScriptComponent {
    //
    get host(): T {
        if (this.wasDisposed) {
            //
            throw new Error("ScriptBehavior host is disposed");
        }

        let parent = this.parentComponent as T;

        if (parent == null && this.data.parentId) {
            parent = this.opts.container.byInternalId(this.data.parentId) as T;
        }

        if (parent.componentType == "spawn") {
            parent = (parent as any)._avatar;
        }
        //return this.parentComponent as T;
        return parent;
    }

    get isBehavior() {
        return true;
    }
}
