import {
  Object3D,
  AnimationMixer,
  MeshBasicMaterial,
  Mesh,
  LoopOnce,
  LoopPingPong,
  LoopRepeat,
} from "three";

import { DEBUG_PHYSICS } from "engine/constants";

import Emitter from "engine/events/emitter";

import Events from "engine/events/events";

import { disposeThreeResources } from "engine/utils/dispose";

import { mergeBufferGeometries } from "engine/loaders/utils";

import Scene from "engine/scene";

export default class ClassicWrapper extends Object3D {
  constructor(gltf, data) {
    super();

    this.isClassic = true;

    this.gltf = gltf;

    this.opts = data;

    this._hasActiveAnimations = false;

    this.add(gltf.scene);

    if (data.position) {
      this.position.copy(data.position);
    }

    if (data.scale) {
      this.scale.copy(data.scale);
    }

    if (data.rotation) {
      this.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
    }

    this.paused = true;

    this.actions = {};

    this.activeAnimations = data.animations ?? {};

    this._opacity = data.opacity ?? 1;

    this.animations = this.gltf.animations.slice();

    this.opacity = this._opacity;

    this.useTransparency = data.useTransparency ?? false;
  }

  set opacity(value) {
    this.gltf.scene.traverse((child) => {
      // I'm a mesh
      if (child.material != null) {
        if (Array.isArray(child.material)) {
          for (var i = 0; i < child.material.length; i++) {
            if (child.material[i]._originalOpacity == null) {
              child.material[i]._originalOpacity = child.material[i].opacity;
            }
            child.material[i].opacity =
              value * child.material[i]._originalOpacity;
          }
        } else {
          if (child.material._originalOpacity == null) {
            child.material._originalOpacity = child.material.opacity;
          }

          child.material.opacity = value * child.material._originalOpacity;
        }
      }
    });

    this._opacity = value;
  }

  get opacity() {
    return this._opacity;
  }

  updateCoords(position, quaternion, scale) {
    this.position.copy(position);

    this.quaternion.copy(quaternion);

    this.scale.copy(scale);

    if (this.collisionMesh) {
      this.collisionMesh.position.copy(position);

      this.collisionMesh.quaternion.copy(quaternion);

      this.collisionMesh.scale.copy(scale);
    }
  }

  update(delta) {
    this.mixer.update(delta);
  }

  stopAllAnimations = ({ fadeOut = 0.1 }) => {
    Object.keys(this.activeAnimations).forEach((key) => {
      this.stop(key, { fadeOut });
    });
  };

  play = (name, opts = {}) => {
    let i = 0;

    let exists = false;

    while (i < this.animations.length) {
      if (this.animations[i].name == name) {
        exists = true;
      }
      i++;
    }

    if (exists) {
      // INIT
      this.addEvents();

      if (this.mixer == null) {
        this.mixer = new AnimationMixer(this.gltf.scene);
      }
      // INIT

      const animation = this.animations.find(
        (anim) => anim.name.toUpperCase() == name.toUpperCase()
      );

      var action = this.mixer.existingAction(animation);

      if (action == null) {
        action = this.mixer.clipAction(animation);
      }

      if (!opts.reset && action.isRunning()) return;

      if (opts.stopAll) {
        this.stopAllAnimations(opts);
      }

      let loopMode = null;

      if (opts.callback != null) {
        if (action.__funcListener != null) {
          this.mixer.removeEventListener("loop", action.__funcListener);

          this.mixer.removeEventListener("finished", action.__funcListener);

          action.__funcListener = null;
        }

        action.__funcListener = (e) => {
          if (e.action == action) {
            if (e.type == "finished") {
              this.mixer.removeEventListener("loop", action.__funcListener);

              this.mixer.removeEventListener("finished", action.__funcListener);

              action.__funcListener = null;
            }

            opts.callback(e);
          }
        };

        this.mixer.addEventListener("loop", action.__funcListener);

        this.mixer.addEventListener("finished", action.__funcListener);
      }

      if (opts.loop != null) {
        if (opts.loop == "once") {
          loopMode = LoopOnce;
        }
        if (opts.loop == "repeat") {
          loopMode = LoopRepeat;
        }

        if (opts.loop == "pingpong") {
          loopMode = LoopPingPong;
        }
      }

      if (opts.repetitions != null) {
        action.repetitions = opts.repetitions;
      }

      action.clampWhenFinished = opts.clampWhenFinished ?? false;

      action
        .reset()
        .setEffectiveTimeScale(opts.timeScale ?? 1)
        .setEffectiveWeight(opts.weight ?? 1)
        .fadeIn(opts.fadeIn || 0)
        .setLoop(loopMode ?? LoopRepeat, opts.repetitions ?? Infinity)
        .play();

      this.activeAnimations[name] = true;
    } else {
      console.error("animation not found", name);
    }
  };

  stop = (name = null, opts = {}) => {
    if (!this.activeAnimations[name]) {
      console.error("STOP Animation not found", name);
      return;
    }

    delete this.activeAnimations[name];

    const animation = this.animations.find(
      (anim) => anim.name.toUpperCase() == name.toUpperCase()
    );

    const action = this.mixer.existingAction(animation);

    if (action == null) return;

    if (!opts.fadeOut) {
      action.stop();
    } else {
      action.fadeOut(opts.fadeOut ?? 0);
    }

    if (action.__funcListener) {
      action.__funcListener({ type: "finished", action });
    }
  };

  stopAll(removeEvents = true) {
    this.activeAnimations = {};

    this.mixer?.setTime(0);

    this.mixer?.stopAllAction();

    if (removeEvents == true) {
      this.removeEvents();
    }
  }

  setAnimationAtTime(animation, val) {
    let clipAnim = this.animations.find((anim) => anim.name == animation);

    var action = this.mixer.existingAction(clipAnim);

    if (action == null) {
      action = this.mixer.clipAction(clipAnim);
    }

    action.play();

    action.time = val;

    action._mixer?.update(0);
  }

  getAnimationData() {
    let anims = {};

    this.gltf.animations.forEach((anim) => {
      anims[anim.name] = anim;
    });

    return anims;
  }

  buildCollisionMesh() {
    let geometries = [];

    this.gltf.scene.updateMatrixWorld(true, true);

    this.gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.updateMatrixWorld();

        const geom = child.geometry.clone();

        geom.applyMatrix4(child.matrixWorld);

        geometries.push(geom);
      }
    });

    if (geometries.length == 0) {
      return;
    }

    const mergedGeometry = mergeBufferGeometries(geometries, false, {
      forceList: ["position"],
      ignoreMorphTargets: true,
    });

    const mesh = new Mesh(
      mergedGeometry,

      new MeshBasicMaterial({ color: 0xff00ff, wireframe: true })
    );

    this.collisionMesh = mesh;

    if (DEBUG_PHYSICS) {
      Scene.add(mesh);
    }

    return mesh;
  }

  addEvents() {
    if (this.updateEvent == null) {
      this.updateEvent = this.update.bind(this);

      Emitter.on(Events.PRE_UPDATE, this.updateEvent);
    }
  }

  removeEvents() {
    if (this.updateEvent != null) {
      Emitter.off(Events.PRE_UPDATE, this.updateEvent);

      this.updateEvent = null;
    }
  }

  dispose(force = false) {
    if (this.mixer) {
      this.mixer = null;
    }

    this.removeEvents();

    this.gltf.scene.traverse((child) => {
      if (child.dispose != null) {
        child.dispose();
      }
    });

    if (force == true) {
      disposeThreeResources(this.gltf.scene);
    }
  }
}
