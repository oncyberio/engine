// @ts-check

import { Component3D } from "engine/abstract/component3D";
import { GroupComponentData } from "./groupdata";
import { UseParam } from "engine/space/params";
import { Box3, BoxGeometry, Mesh, MeshBasicMaterial } from "three";
import { IS_EDIT_MODE, SET_SHADOW_NEEDS_UPDATE } from "engine/constants";
import PipeLineMesh from "engine/abstract/pipelinemesh";

/**
 * @public
 *
 * This component is used to group multiple components together
 */
@UseParam()
export class GroupComponent extends Component3D<GroupComponentData> {
    //

    private _mesh: Mesh = null;

    protected async init() {
        //
        if (IS_EDIT_MODE) {
            //
            this._mesh = new PipeLineMesh(
                new BoxGeometry(1, 1, 1),
                new MeshBasicMaterial({ color: 0xff0000 }),
                {
                    occlusionMaterial: new MeshBasicMaterial({
                        color: 0x000000,
                    }),
                }
            );

            this.add(this._mesh);

            this._mesh.visible = false;
        }

        this.on(this.EVENTS.CHILD_ADDED, this._update3D);
        this.on(this.EVENTS.CHILD_REMOVED, this._update3D);

        this._update3D();
    }

    private _update3D = () => {
        if (IS_EDIT_MODE) {
            this._mesh.visible = this.childComponents.length == 0;
        }
    };

    /**
     * @internal
     */
    onDataChange(opts) {
        this._update3D();
        if (IS_EDIT_MODE && !opts?.isProgress && this.childComponents.length > 0) {
            SET_SHADOW_NEEDS_UPDATE(true);
        }
    }

    protected dispose() {
        this.off(this.EVENTS.CHILD_ADDED, this._update3D);
        this.off(this.EVENTS.CHILD_REMOVED, this._update3D);
    }

    private _childBBox = new Box3();

    getCollisionMesh() {
        return this._mesh;
    }

    protected _getBBoxImp(target: Box3) {
        //
        const childBox = this._childBBox;

        this.childComponents.forEach((child) => {
            child.updateMatrixWorld(false);
            child.getBBox(childBox);
            target.union(childBox);
        });

        return target;
    }
}
