import {
  Mesh,
  Quaternion,
  Color,
  Vector3,
  Matrix4,
  BufferGeometry,
  MeshBasicMaterial,
  DoubleSide,
  Box3,
} from "three";
import InstancedPipelineMesh from "./instancedpipelinemesh";

let quat = new Quaternion();

let debugMesh = new Mesh();

export default class InstancedMeshWrapper {
  constructor(mesh, geometry, id, opts = {}) {
    /**
     * @type {InstancedPipelineMesh}
     */
    this.mesh = mesh;

    this.id = id;

    this.geometry = geometry;

    this.opts = opts;

    // used for random idness

    this.randomID = Math.random();

    this._dynamicShadow =
      this.opts?.enableRealTimeShadow != null
        ? this.opts.enableRealTimeShadow == true
        : false;

    this.scale = new Vector3(1, 1, 1);

    // implement custom frustum test in case its needed

    if (opts.customFrustumTest) {
      this.customFrustumTest = opts.customFrustumTest;
    }

    if (this.opts.scale) {
      if (this.opts.scale.x != null) {
        this.setScale(this.opts.scale.x, this.opts.scale.y, this.opts.scale.z);
      } else {
        this.setScale(
          this.opts.scale[0],
          this.opts.scale[1],
          this.opts.scale[2]
        );
      }
    }

    if (this.opts.boundingBox) {
      this.boundingBox = this.opts.boundingBox;
    }

    this.color = new Color();

    if (opts.color) {
      this.setColor(this.opts.color);
    }

    this.position = new Vector3();

    if (this.opts.position) {
      if (this.opts.position[0] != null) {
        this.setPosition({
          x: this.opts.position[0],
          y: this.opts.position[1],
          z: this.opts.position[2],
        });
      } else {
        this.setPosition({
          x: this.opts.position.x,
          y: this.opts.position.y,
          z: this.opts.position.z,
        });
      }
    } else {
      this.setPosition({
        x: 0,
        y: 0,
        z: 0,
      });
    }

    this.rotation = [0, 0, 0, 1];

    this.eulerRotation = { x: 0, y: 0, z: 0 };

    if (this.opts.rotation) {
      if (this.opts.rotation.x != null) {
        this.opts.rotation = [
          this.opts.rotation.x,
          this.opts.rotation.y,
          this.opts.rotation.z,
        ];
      }
      this.setRotation(this.opts.rotation);
    }

    this.rotationY = 0;

    if (this.opts.rotationY != null) {
      this.setRotationY(this.opts.rotationY);
    }

    if (this.opts.border != null) {
      this.setBorder(this.opts.border);
    }

    this._atlas = { x: 1, y: 1, z: 0, w: 0 };

    if (this.opts.atlas != null) {
      this._atlas = {
        x: this.opts.atlas.x,
        y: this.opts.atlas.y,
        z: this.opts.atlas.z,
        w: this.opts.atlas.w,
      };
    }

    this._opacity = 1;

    if (this.opts.opacity != null) {
      this._opacity = this.opts.opacity;
    }

    if (this.opts.plugins && this.opts.plugins.length > 0) {
      for (let i = 0; i < this.opts.plugins.length; i++) {
        const plugin = this.opts.plugins[i];

        for (let key in plugin.attributes) {
          if (this[key] == null) {
            this["_" + key] = plugin.attributes[key].defaultValue;

            Object.defineProperty(this, key, {
              get: function () {
                return this["_" + key];
              },
              set: function (val) {
                this["_" + key] = val;
              },
            });

            // possibility to pass as data the key value, like spawnTimer = xxx instead of using the default value

            if (this.opts[key] != null) {
              this[key] = this.opts[key];
            } else {
              this[key] = plugin.attributes[key].defaultValue;
            }
          }
        }
      }
    }

    this._visible = true;

    this.__objectSource = null;
  }

  set atlas(val) {
    this._atlas = val;
  }

  get atlas() {
    return this._atlas;
  }

  set opacity(val) {
    this._opacity = val;
  }

  get opacity() {
    return this._opacity;
  }

  setBorder(val) {
    this.border = val;
  }

  setPosition(val) {
    this.position = val;
  }

  setRotationY(val) {
    this.rotationY = val;
  }

  setRotation(val) {
    this.eulerRotation = { x: val[0], y: val[1], z: val[2] };

    debugMesh.rotation.x = val[0];
    debugMesh.rotation.y = val[1];
    debugMesh.rotation.z = val[2];

    quat.setFromEuler(debugMesh.rotation);

    this.rotation = [quat.x, quat.y, quat.z, quat.w];
  }

  setQuaternion(val) {
    this.rotation = [val.x, val.y, val.z, val.w];
  }

  attachTo(source) {
    this.__objectSource = source;
  }

  updateFromSource(source = null) {
    source ??= this.__objectSource;

    if (source == null) return;

    const pos = source.positionWorld ?? source.position;
    const quat = source.quaternionWorld ?? source.quaternion;
    const scale = source.scaleWorld ?? source.scale;

    // source.rotation.order = 'YXZ'

    if (pos && !source.ignorePosition) {
      this.position.x = pos.x;
      this.position.y = pos.y;
      this.position.z = pos.z;
    }

    if (quat && !source.ignoreRotation) {
      this.rotation[0] = quat.x;
      this.rotation[1] = quat.y;
      this.rotation[2] = quat.z;
      this.rotation[3] = quat.w;
    }

    if (scale && !source.ignoreScale) {
      this.scale.x = scale.x;
      this.scale.y = scale.y;
      this.scale.z = scale.z;
    }

    this.visible = source.visible;
  }

  setColor(val) {
    if (typeof val[0] === "number") {
      this.color.r = val[0];
      this.color.g = val[1];
      this.color.b = val[2];
    } else {
      this.color.set(val);
    }
  }

  setScale(x, y, z) {
    this.scale.set(x, y, z);
  }

  set visible(val) {
    this._visible = val;
  }

  get visible() {
    return this._visible;
  }

  set dynamicShadow(val) {
    this._dynamicShadow = false;

    if (val == "dynamic") {
      this._dynamicShadow = true;
    }
  }

  get dynamicShadow() {
    return this._dynamicShadow;
  }

  // getBBox() {
  //     return this._getBBoxImp(new Box3());
  // }

  getBBox() {
    if (this.mesh.geometry.boundingBox == null) {
      this.mesh.geometry.computeBoundingBox();
    }

    let box = this.mesh.geometry.boundingBox.clone();

    const quat = new Quaternion();

    if (this.rotation) {
      quat.set(
        this.rotation[0],
        this.rotation[1],
        this.rotation[2],
        this.rotation[3]
      );
    } else if (this.rotationY != null) {
      quat.setFromAxisAngle(new Vector3(0, 1, 0), this.rotationY);
    }

    const mat = new Matrix4().compose(this.position, quat, this.scale);

    box.applyMatrix4(mat);

    return box;
  }

  /**
   * @param {Box3} target
   */
  _getBBoxImp(target) {
    //
    if (this.mesh.geometry.boundingBox == null) {
      this.mesh.geometry.computeBoundingBox();
    }

    let box = target.copy(this.mesh.geometry.boundingBox);

    const quat = new Quaternion();

    if (this.rotation) {
      quat.set(
        this.rotation[0],
        this.rotation[1],
        this.rotation[2],
        this.rotation[3]
      );
    } else if (this.rotationY != null) {
      quat.setFromAxisAngle(new Vector3(0, 1, 0), this.rotationY);
    }

    const mat = new Matrix4().compose(this.position, quat, this.scale);

    box.applyMatrix4(mat);

    return box;
  }

  set sorter(sorter) {
    this.geometry.sorter = sorter;
  }

  get sorter() {
    return this.geometry.sorter;
  }

  buildCollisionMesh() {
    const geometry = new BufferGeometry();

    geometry.setAttribute("position", this.geometry.getAttribute("position"));

    geometry.setAttribute("uv", this.geometry.getAttribute("uv"));

    geometry.setIndex(this.geometry.getIndex());

    const material = new MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      side: DoubleSide,
    });
    const mesh = new Mesh(geometry, material);

    mesh.scale.x = this.geometry.scaleRatio || 1;

    mesh.visible = false;

    return mesh;
  }

  remove() {
    //
    this.mesh?.remove(this);
  }
}
