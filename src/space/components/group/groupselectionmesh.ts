// @ts-check

import PipeLineMesh from "engine/abstract/pipelinemesh";
import {
  BoxGeometry,
  MeshBasicMaterial,
  Box3,
  Quaternion,
  Vector3,
  Matrix4,
} from "three";
import { GroupComponent } from "./groupcomponent";
import {
  DisposePipelinesMeshes,
  disposeThreeResources,
} from "engine/utils/dispose";
import Emitter from "engine/events/emitter";
import Events from "engine/events/events";

export class GroupSelectionMesh extends PipeLineMesh {
  //
  isDragging = false;

  _active = false;

  constructor(private group: GroupComponent) {
    super(
      new BoxGeometry(1, 1, 1),
      new MeshBasicMaterial({
        // visible: false,
        transparent: true,
        color: 0xff0000,
        opacity: 0.2,
        depthTest: false,
        depthWrite: false,
      })
    );

    this.visible = false;
  }

  _box = new Box3();
  _childBox = new Box3();
  _mat4 = new Matrix4();

  get active() {
    //
    return this._active;
  }

  set active(value) {
    //
    if (this._active == value) return;

    this._active = value;

    this.visible = value;
  }

  // _initGroupPosition = new Vector3();
  // _initGroupQuaternion = new Quaternion();

  // _initPositionInv = new Vector3();
  // _initQuaternionInv = new Quaternion();
  // // _initScaleInv = new Vector3()

  // _deltaPosition = new Vector3();
  // _deltaQuaternion = new Quaternion();
  // _deltaScale = new Vector3()

  // dragStart() {
  //     //
  //     // console.log('MultiSelectMesh dragStart')
  //     this.isDragging = true;

  //     this._initGroupPosition.copy(this.group.positionWorld);
  //     this._initGroupQuaternion.copy(this.group.quaternionWorld);

  //     this.getWorldPosition(this._initPositionInv).multiplyScalar(-1);

  //     this.getWorldQuaternion(this._initQuaternionInv).invert();

  //     // this.getWorldScale(this._initScaleInv).set(
  //     //     1 / this._initScaleInv.x,
  //     //     1 / this._initScaleInv.y,
  //     //     1 / this._initScaleInv.z,
  //     // )
  // }

  // syncWithTransform(opts) {
  //     //
  //     const deltaPosition = this._deltaPosition
  //         .copy(this.position)
  //         .add(this._initPositionInv);

  //     const deltaQuaternion = this._deltaQuaternion
  //         .copy(this.quaternion)
  //         .multiply(this._initQuaternionInv);

  //     const newWorldPos = this._initGroupPosition.clone().add(deltaPosition);
  //     const newWorldQuat = this._initGroupQuaternion
  //         .clone()
  //         .multiply(deltaQuaternion);

  //     this.group._setWorldPosition(newWorldPos);

  //     this.group._setWorldQuaternion(newWorldQuat);

  //     this.group.syncWithTransform(opts);
  // }

  // dragEnd() {
  //     //
  //     // console.log('MultiSelectMesh dragEnd')

  //     this.isDragging = false;
  // }

  _onDispose() {
    //
    disposeThreeResources(this);
  }
}
