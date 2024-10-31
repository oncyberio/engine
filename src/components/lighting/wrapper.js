import {
  Object3D,
  CameraHelper,
  DirectionalLightHelper,
  DirectionalLight,
  AmbientLight,
  WebGLShadowMap,
  PCFSoftShadowMap,
  Vector3,
  Matrix4,
  Frustum,
} from "three";

import {
  FBO_DEBUG,
  SHADOW_NEEDS_UPDATE,
  SET_SHADOW_NEEDS_UPDATE,
  CAMERA_LAYERS,
  IS_EDIT_MODE,
} from "engine/constants";

import FBOHelper from "engine/globals/fbohelper.js";

import Emitter from "engine/events/emitter";

import Events from "engine/events/events";

const SHADOW_MAP_WIDTH = 2048;

import Renderer from "engine/renderer";

const v3 = new Vector3();

import Camera from "engine/camera";

import Scene from "engine/scene";
import mediator from "engine/events/mediator";

const DEBUG_REAL_TIME_SHADOW = false;

export default class LightingWrapper extends Object3D {
  constructor(opts = {}, scene) {
    super();

    console.log("Object3D", new Object3D());

    this.name = "LIGHTING";

    this.meshCounts = 0;

    this.parentScene = scene;

    this.active = false;

    this.opts = opts;

    this.debugMapAttached = false;

    this.debugMapAttachedRealtime = false;

    this.showHelper = !!this.opts.helper;

    this.realTimeTarget = null;

    this.opts = opts;

    this.ambientLight = new AmbientLight(0xffffff, 1);

    this.ambientLight.intensity = Math.PI;

    this.add(this.ambientLight);

    this.needsRender = false;

    this.initiated = false;

    if (this.opts && this.opts.enabled) {
      this.activate(opts);
    }

    this._attachedObject = null;

    // globalThis.lighting = this;

    this.addEvents();
  }

  attachObject(object) {
    this._attachedObject = object;

    debugger;
  }

  init() {
    if (this.initiated == true) {
      return;
    }

    this.initiated = true;

    this.directionalLight = new DirectionalLight(0xffffff, 0.25);

    this.directionalLight.position.set(0, 10, 0);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.x = SHADOW_MAP_WIDTH;
    this.directionalLight.shadow.mapSize.y = SHADOW_MAP_WIDTH;
    this.directionalLight.position.copy(this.opts.lightPosition);
    this.directionalLight.shadow.bias = this.opts.bias;

    this.directionalLight.intensity = this.opts.intensity * Math.PI;
    this.directionalLight.shadow.camera.layers.enableAll();
    this.directionalLight.shadow.camera.layers.disable(CAMERA_LAYERS.DYNAMIC);

    if (IS_EDIT_MODE != true) {
      this.directionalLight.matrixAutoUpdate = false;
    }

    // real time directional

    this.directionalLightRealTime = new DirectionalLight(0xffffff, 1);
    this.directionalLightRealTime.castShadow = true;
    this.directionalLightRealTime.shadow.mapSize.x = SHADOW_MAP_WIDTH;
    this.directionalLightRealTime.shadow.mapSize.y = SHADOW_MAP_WIDTH;
    this.directionalLightRealTime.shadow.bias = -0.001;

    this.directionalLightRealTime.intensity = 1 * Math.PI;
    this.directionalLightRealTime.shadow.shadowOnly = true;
    this.directionalLightRealTime.shadow.camera.layers.disableAll();
    this.directionalLightRealTime.shadow.camera.layers.enable(
      CAMERA_LAYERS.DYNAMIC
    );

    this.directionalLightRealTime.name = "this.directionalLightRealTime";

    const size = 300;
    const aspect = 1;
    const camera = this.directionalLightRealTime.shadow.camera;
    camera.left = (size * aspect) / -2;
    camera.right = (size * aspect) / 2;
    camera.top = size / 2;
    camera.bottom = size / -2;
    camera.near = 0.01;
    camera.far = 450;
    camera.updateProjectionMatrix();

    if (DEBUG_REAL_TIME_SHADOW) {
      this.ddhelper = new DirectionalLightHelper(
        this.directionalLightRealTime,
        10
      );

      Scene.add(this.ddhelper);

      this.ddCamHelper = new CameraHelper(
        this.directionalLightRealTime.shadow.camera
      );

      Scene.add(this.ddCamHelper);
    }

    // debugger;

    this.directionalLightRealTime.layers.disableAll();
    this.directionalLightRealTime.layers.enable(CAMERA_LAYERS.DYNAMIC);
  }

  activate() {
    if (this.active == false) {
      this.init();

      Renderer.shadowMap.enabled = true;

      if (this.realTimeShadowMap == null) {
        this.realTimeShadowMap = new WebGLShadowMap(
          Renderer,
          Renderer.objects,
          Renderer.capabilities
        );

        this.realTimeShadowMap.type = PCFSoftShadowMap;
      }

      if (this.realTimeShadowMap) {
        this.realTimeShadowMap.onRender = this.renderRealTime.bind(this);
      }

      this.realTimeShadowMap.enabled = true;

      this.ambientLight.intensity = 0.5 * Math.PI;

      this.active = true;

      this.add(this.directionalLight);

      this.add(this.directionalLight.target);

      this.directionalLight.updateMatrix();
      this.directionalLight.target.updateMatrix();

      this.updateShadowCamera();

      this.needsRender = true;

      this.addEvents();
    }
  }

  desactivate(force = false) {
    if (this.active) {
      this.ambientLight.intensity = Math.PI;

      this.active = false;

      this.remove(this.directionalLight);

      this.remove(this.directionalLight.target);

      Renderer.shadowMap.enabled = false;

      Renderer.shadowMap.autoUpdate = false;

      if (this.realTimeShadowMap) {
        this.realTimeShadowMap.enabled = false;
      }
      // Renderer.shadowMap2.enabled = false;

      if (
        force != false &&
        this.directionalLight &&
        this.directionalLight.shadow.map
      ) {
        const target = Renderer.getRenderTarget();

        Renderer.setRenderTarget(this.directionalLight.shadow.map);

        Renderer.clear(true, true, false);

        Renderer.setRenderTarget(target);
      }

      this.toggleHelpers(false);

      if (this.directionalLightRealTime.parent) {
        this.directionalLightRealTime.parent.remove(
          this.directionalLightRealTime
        );
      }

      if (this.directionalLightRealTime.target.parent) {
        this.directionalLightRealTime.target.parent.remove(
          this.directionalLightRealTime.target
        );
      }
    }
  }

  setRealTimeRender(val) {
    if (this.realTimeShadowMap) {
      this.realTimeShadowMap.needsRender = val;
    }
  }

  getCustomShadowMap() {
    if (this.realTimeShadowMap) {
      return [this.realTimeShadowMap];
    }

    return [];
  }

  renderRealTime(scene, camera) {
    scene.add(this.directionalLightRealTime);
    scene.add(this.directionalLightRealTime.target);

    this.directionalLightRealTime.enabled = true;

    if (
      this.realTimeShadowMap.needsRender == false ||
      camera.getShadowTarget == null
    ) {
      this.directionalLightRealTime.enabled = false;
      return;
    }

    // const target = camera.getShadowTarget();

    // if (target == null) {
    //     return;
    // }

    // camera.layers.disableAll()

    // camera.layers.enable( CAMERA_LAYERS.DYNAMIC )

    // Renderer.renderRealTimeShadow = true

    // this.attachLighting(this.directionalLightRealTime, target);
    this.attachLighting(this.directionalLightRealTime);

    if (DEBUG_REAL_TIME_SHADOW) {
      this.ddhelper.update();

      this.ddhelper.updateMatrixWorld(true);

      this.ddCamHelper.update();

      this.ddCamHelper.updateMatrixWorld(true);
    }

    this.realTimeShadowMap.render(
      [this.directionalLightRealTime],
      scene,
      this.directionalLightRealTime.shadow.camera
    );

    // scene.remove(this.directionalLightRealTime);
    // scene.remove(this.directionalLightRealTime.target);

    // camera.layers.enableAll()

    this.realTimeShadowMap.needsRender = false;

    if (
      FBO_DEBUG &&
      this.debugMapAttachedRealtime == false &&
      this.directionalLightRealTime.shadow.map
    ) {
      FBOHelper.attach(
        this.directionalLightRealTime.shadow.map,
        "real time shadowmap"
      );

      this.debugMapAttachedRealtime = true;
    }

    // Renderer.renderRealTimeShadow = false

    return this.directionalLightRealTime;
  }

  attachLighting(light) {
    const target = this.calculateFrustumCentroid(Camera.current);

    v3.copy(this.opts.lightDirection).multiplyScalar(150);

    light.position.copy(target).sub(v3);

    light.target.position.copy(target);

    light.target.position.add(this.opts.lightDirection);

    light.updateMatrixWorld(true);

    light.target.updateMatrixWorld(true);

    const camera = light.shadow.camera;

    camera.updateMatrixWorld(true);

    // camera.updateProjectionMatrix();
  }

  // attachLighting( light, target ){

  //     v3.copy(this.opts.lightDirection ).multiplyScalar( 40 )

  //     light.position.copy( target.position ).sub( v3 )

  //     light.target.position.copy(
  //         target.position,
  //     )

  //     light.target.position.add( this.opts.lightDirection )

  //     const size = 200

  //     const aspect = 1

  //     const camera = light.shadow.camera

  //     camera.left = (size * aspect) / -2
  //     camera.right = (size * aspect) / 2

  //     camera.top = size / 2
  //     camera.bottom = size / -2

  //     camera.near = 0
  //     camera.far  = 400

  //     light.updateMatrixWorld( true )

  //     light.target.updateMatrixWorld( true )

  //     camera.updateMatrixWorld( true )

  //     camera.updateProjectionMatrix()

  // }

  render(val) {
    if (this.opts.enabled) {
      this.activate();

      // this.showHelper = false;

      this.toggleHelpers();

      if (
        FBO_DEBUG &&
        this.debugMapAttached == false &&
        this.directionalLight.shadow.map
      ) {
        FBOHelper.attach(this.directionalLight.shadow.map, "shadowmap");

        this.debugMapAttached = true;
      }

      this.directionalLight.position.copy(this.opts.lightPosition);

      if (this._attachedObject) {
        this.directionalLight.position.y += this._attachedObject.position.y;
      }

      this.directionalLight.intensity = this.opts.intensity * Math.PI;

      this.directionalLight.target.position.copy(
        this.directionalLight.position
      );

      this.directionalLight.target.position.add(this.opts.lightDirection);

      if (this.helper) {
        if (this.showHelper) {
          this.updateShadowCamera();

          this.helper.update();

          this.cameraHelper.update();

          this.cameraHelper.position.copy(this.directionalLight.position);
        }
      }

      if (this.needsRender || val == true || SHADOW_NEEDS_UPDATE == true) {
        SET_SHADOW_NEEDS_UPDATE(false);

        this.updateShadowCamera();

        Renderer.shadowMap.autoUpdate = true;

        this.needsRender = false;

        if (this.promiseOff != null) {
          this.promiseOff.kill();

          this.promiseOff = null;
        }
      } else {
        // next two frames turn off

        if (this.promiseOff == null) {
          this.promiseOff = mediator.delayedCall(0.01, () => {
            if (this.needsRender == false) {
              this.promiseOff = null;

              Renderer.shadowMap.autoUpdate = false;
            }
          });
        }
      }

      // samsy

      // Renderer.shadowMap.autoUpdate = true
    } else {
      this.desactivate();
    }
  }

  detectSceneChange() {
    let count = 0;

    this.parentScene.traverse((child) => {
      if (child.material && child.castShadow) {
        count++;
      }
    });

    let changed = this.meshCounts != count;

    this.meshCounts = count;

    if (changed) {
      this.needsRender = true;
    }
  }

  onOcclusion(val) {
    // return;

    if (val) {
      if (this.helper && this.showHelper) {
        this.helper.visible = false;

        this.cameraHelper.visible = false;
      }
    } else {
      if (this.helper && this.showHelper) {
        this.helper.visible = true;

        this.cameraHelper.visible = true;
      }
    }
  }

  toggleHelpers() {
    const value = this.showHelper;

    if (this.helper == null && value == true) {
      this.helper = new DirectionalLightHelper(this.directionalLight, 5);

      this.cameraHelper = new CameraHelper(this.directionalLight.shadow.camera);
    }

    if (this.helper) {
      if (value && this.opts.enabled) {
        this.add(this.helper);

        this.add(this.cameraHelper);
      } else {
        this.remove(this.helper);

        this.remove(this.cameraHelper);
      }
    }
  }

  addEvents() {
    if (this.updateEvent == null) {
      this.updateEvent = this.render.bind(this);

      Emitter.on(Events.DUSK_UPDATE, this.updateEvent);

      // if( UPLOADER_MODE || EDIT_MODE ) {

      this.occlusionEvent = this.onOcclusion.bind(this);

      Emitter.on(Events.OCCLUSION, this.occlusionEvent);

      // }

      this.mirrorEvent = this.onOcclusion.bind(this);

      Emitter.on(Events.MIRROR, this.mirrorEvent);

      this.needsRender = true;
    }
  }

  removeEvents() {
    if (this.updateEvent != null) {
      if (this.realTimeShadowMap) {
        this.realTimeShadowMap.onRender = null;
      }

      Emitter.off(Events.DUSK_UPDATE, this.updateEvent);

      this.updateEvent = null;

      // if( UPLOADER_MODE || EDIT_MODE ) {

      Emitter.off(Events.OCCLUSION, this.occlusionEvent);

      this.occlusionEvent = null;
      // }

      Emitter.off(Events.MIRROR, this.mirrorEvent);

      this.mirrorEvent = null;
    }
  }

  updateShadowCamera() {
    const size = this.opts.size;
    const aspect = 1;

    const camera = this.directionalLight.shadow.camera;

    camera.left = (size * aspect) / -2;
    camera.right = (size * aspect) / 2;

    camera.top = size / 2;
    camera.bottom = size / -2;

    camera.near = this.opts.near;
    camera.far = this.opts.far;

    camera.updateProjectionMatrix();

    // this.needsRender = true
  }

  dispose() {
    this.removeEvents();

    this.desactivate(true);

    if (this.directionalLight) {
      this.remove(this.directionalLight);

      this.directionalLight.shadow.dispose();

      this.directionalLight.dispose();

      this.directionalLight = null;
    }

    if (this.realTimeShadowMap) {
      console.log(this.realTimeShadowMap);

      // debugger;

      // this.realTimeShadowMap.dispose()

      this.realTimeShadowMap = null;
    }

    if (this.directionalLightRealTime) {
      this.remove(this.directionalLightRealTime);

      this.directionalLightRealTime.shadow.dispose();

      this.directionalLightRealTime.dispose();

      this.directionalLightRealTime = null;
    }

    this.remove(this.ambientLight);

    this.ambientLight.dispose();

    this.ambientLight = null;

    if (this.helper) {
      this.helper.dispose();

      this.helper = null;

      this.cameraHelper.dispose();

      this.cameraHelper = null;
    }
  }

  calculateFrustumCentroid(camera) {
    const previousFar = camera.far;

    camera.far = 300;

    camera.updateProjectionMatrix();

    let frustum = new Frustum();
    let cameraViewProjectionMatrix = new Matrix4();

    camera.updateMatrixWorld(); // make sure the camera matrix is updated
    // camera.matrixWorldInverse.getInverse(camera.matrixWorld);
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    cameraViewProjectionMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    frustum.setFromProjectionMatrix(cameraViewProjectionMatrix);

    let centroid = new Vector3(0, 0, 0);
    let vertices = [
      new Vector3(-1, -1, -1),
      new Vector3(1, -1, -1),
      new Vector3(-1, 1, -1),
      new Vector3(1, 1, -1),
      new Vector3(-1, -1, 1),
      new Vector3(1, -1, 1),
      new Vector3(-1, 1, 1),
      new Vector3(1, 1, 1),
    ];

    for (let i = 0; i < vertices.length; i++) {
      vertices[i].unproject(camera);
      centroid.add(vertices[i]);
    }

    centroid.divideScalar(vertices.length);

    camera.far = previousFar;

    camera.updateProjectionMatrix();

    return centroid;
  }

  positionShadowCamera(light, frustumCorners, lightDirection) {
    // Compute the centroid of the frustum
    const centroid = new Vector3();
    for (const corner of frustumCorners) {
      centroid.add(corner);
    }
    centroid.divideScalar(frustumCorners.length);

    // Position the light target at the centroid
    if (!light.target) {
      light.target = new Object3D();
    }
    light.target.position.copy(centroid);
    light.add(light.target);

    // Position the light itself
    light.position
      .copy(centroid)
      .add(lightDirection.clone().normalize().multiplyScalar(-200)); // distance can be adjusted

    // Update the matrices
    light.target.updateMatrixWorld();
    light.updateMatrixWorld();
  }

  adjustShadowCameraFrustum(shadowCamera, frustumCorners, light) {
    let minX, maxX, minY, maxY, minZ, maxZ;
    minX = minY = minZ = Infinity;
    maxX = maxY = maxZ = -Infinity;

    // Create a matrix that represents the transformation from world space to light space
    const lightMatrix = new Matrix4();
    const lightTarget = new Vector3();
    light.target.getWorldPosition(lightTarget);
    lightMatrix.lookAt(light.position, lightTarget, new Vector3(0, 1, 0));

    const inverseLightMatrix = new Matrix4().copy(lightMatrix).invert();

    frustumCorners.forEach((corner) => {
      const transformedCorner = corner.clone().applyMatrix4(inverseLightMatrix);
      minX = Math.min(minX, transformedCorner.x);
      maxX = Math.max(maxX, transformedCorner.x);
      minY = Math.min(minY, transformedCorner.y);
      maxY = Math.max(maxY, transformedCorner.y);
      minZ = Math.min(minZ, transformedCorner.z);
      maxZ = Math.max(maxZ, transformedCorner.z);
    });

    shadowCamera.left = minX;
    shadowCamera.right = maxX;
    shadowCamera.top = maxY;
    shadowCamera.bottom = minY;
    shadowCamera.near = -maxZ; // Note: In light space, Z is negative forward
    shadowCamera.far = -minZ;
    shadowCamera.updateProjectionMatrix();
  }
}
