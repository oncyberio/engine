// @ts-check

import {
  COMPRESSED_SUPPORT,
  DEBUG_PHYSICS,
  GPU_TIER,
  IS_MOBILE,
} from "engine/constants";

import loader from "engine/loader";

import Emitter from "engine/events/emitter";

import Events from "engine/events/events";

import {
  mergeBufferGeometries,
  deinterleaveGeometry,
} from "engine/loaders/utils";

import scene from "engine/scene";

import { BillboardYMaterial } from "engine/xtend";

import {
  AnimationMixer,
  BufferAttribute,
  BufferGeometry,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Group,
  Vector3,
  Quaternion,
} from "three";

import { disposeObject3D, disposeThreeResources } from "engine/utils/dispose";

function getFirstChildrenNode(scene, name) {
  let i = 0;

  let node = null;

  while (i < scene.children.length) {
    if (scene.children[i].name.toLowerCase() == name) {
      node = scene.children[i];
    }

    i++;
  }

  return node;
}

const RE_PORTAL_PREVIEW = /^((\d+)portal_preview$|portal_preview_(\d+))$/i;

export default class DestinationWrapper extends Group {
  portals = {};

  portalsMixer = null;

  constructor(opts) {
    super();

    this.opts = opts;

    this.addEvents();
  }

  buildCollisionMesh() {
    let geometries = [];

    this.colliderMeshes.forEach((child) => {
      if (child.isMesh) {
        child.updateMatrixWorld();

        // samsy

        // not sure why we needed this but it was causing the mesh to be in the wrong position

        // child.getWorldPosition(child.position);

        // child.getWorldQuaternion(child.quaternion);

        // child.getWorldScale(child.scale);

        const geom = child.geometry.clone();

        geom.applyMatrix4(child.matrixWorld);

        deinterleaveGeometry(geom);

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
      scene.add(mesh);
    }

    return mesh;
  }

  update = (delta) => {
    if (this.mixer) {
      this.mixer.update(delta);
    }

    if (this.portalsMixer) {
      this.portalsMixer.update(delta);
    }
  };

  addEvents() {
    Emitter.on(Events.PRE_UPDATE, this.update);
  }

  removeEvents() {
    Emitter.off(Events.PRE_UPDATE, this.update);
  }

  async get(opts) {
    const { paths } = this.opts;

    const { low, mid, high, low_compressed } = paths;

    let url = high;

    if (GPU_TIER.path == "low") {
      url = low;
    } else if (GPU_TIER.path == "mid") {
      url = mid;
    }
    if (IS_MOBILE && COMPRESSED_SUPPORT) {
      if (low_compressed) {
        url = low_compressed;
      }
    }

    const res = await loader.loadGLTF(url);

    const colliderMeshes = [];

    const placeholders = [];

    // const floorMeshes = [];

    let portalMeshes = [];

    let portalDoorMeshes = [];

    res.scene.traverse((mesh) => {
      if (mesh.name.includes("Portal_Preview_")) {
        portalMeshes.push(mesh);
      }

      if (
        mesh.name.includes("Portal_Door_") ||
        mesh.name.includes("Portal_Mesh_")
      ) {
        portalDoorMeshes.push(mesh);
      }
    });

    this.mixer = new AnimationMixer(res.scene);

    this.portalsMixer = new AnimationMixer(res.scene);

    portalMeshes.forEach((mesh) => {
      const match = RE_PORTAL_PREVIEW.exec(mesh.name);

      this.portals[mesh.name] = {
        mesh: mesh,
        door: portalDoorMeshes.find((door) => {
          return door.name.includes(`Portal_Door_${match?.[3]}`);
        }),
        animations: {
          open: res.animations
            .filter((animation) => {
              return animation.name.includes(`Portal_Open_${match?.[3]}`);
            })
            .map((animation) => this.portalsMixer.clipAction(animation)),
          close: res.animations
            .filter((animation) => {
              return animation.name.includes(`Portal_Close_${match?.[3]}`);
            })
            .map((animation) => this.portalsMixer.clipAction(animation)),
        },
      };
    });

    const grassNode = getFirstChildrenNode(res.scene, "grass");

    grassNode?.traverse?.((child) => {
      if (child.material) {
        child.material = new BillboardYMaterial(child.material);
      }
    });

    // const displayNode = getFirstChildrenNode(res.scene, "display");

    // ====> FLOOR NODE

    const floorNode = getFirstChildrenNode(res.scene, "floor");

    floorNode?.traverse?.((child) => {
      if (child.material) {
        // floorMeshes.push(child);

        colliderMeshes.push(child);
      }
    });

    // ===> INVISIBLE FLOOR NODE

    const floorInvisibleNode = getFirstChildrenNode(
      res.scene,
      "floor_invisible"
    );

    floorInvisibleNode?.traverse?.((child) => {
      if (child.material) {
        // floorMeshes.push(child);

        colliderMeshes.push(child);

        child.visible = false;
      }
    });

    res.scene.remove(floorInvisibleNode);

    // let floors = floorMeshes.map((mesh) => {
    //     // let floor = new SpaceFloor({
    //     //     ...opts,
    //     //     // @ts-ignore
    //     //     raycastMesh: mesh,
    //     // });
    //     // floor.add(mesh);
    //     // return floor;

    //     return mesh;
    // });

    // let spaceFloorContainer = new Object3D();

    // spaceFloorContainer.name = "floor";

    // if (floors?.length) {
    //     spaceFloorContainer.add(...floors);

    //     res.scene.add(spaceFloorContainer);
    // }

    // ====> COLLISION NODE\

    const collisionNode = getFirstChildrenNode(res.scene, "collision");

    collisionNode?.traverse((child) => {
      if (child.material) {
        colliderMeshes.push(child);
      }
    });

    // ====> COLLISION INVISIBLE NODE

    const collisionInvisibleNode = getFirstChildrenNode(
      res.scene,
      "collision_invisible"
    );

    collisionInvisibleNode?.traverse((child) => {
      if (child.material) {
        colliderMeshes.push(child);
      }

      child.visible = false;
    });

    // ====> PLACEHOLDER NODE

    const placeholderNode = getFirstChildrenNode(res.scene, "placeholder");

    placeholderNode?.traverse?.((child) => {
      if (child.material) {
        placeholders.push(child);
      }
    });

    placeholders.forEach((p) => {
      p.parent.remove(p);
    });

    placeholders.forEach((p) => {
      const mesh = new Mesh(
        p.geometry,
        new MeshBasicMaterial({ color: 0xffffff, wireframe: true })
      );

      mesh.position.copy(p.position);

      mesh.rotation.copy(p.rotation);

      mesh.scale.copy(p.scale);

      mesh.name = p.name;

      // res.scene.add(mesh);
    });

    this.scene = res.scene;

    this.colliderMeshes = colliderMeshes;

    this.add(res.scene);

    // ANIMATIONS

    res.animations
      .filter((anim) => !anim.name.toLowerCase().includes("portal_"))
      .forEach((animation) => {
        const action = this.mixer.clipAction(animation);
        action.play();
      });
  }

  destroy() {
    this.mixer?.stopAllAction();

    this.mixer = null;

    this.removeEvents();

    disposeObject3D(this);
  }
}
