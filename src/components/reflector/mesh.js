// @ts-check

import {
  Color,
  Matrix4,
  PerspectiveCamera,
  Plane,
  ShaderMaterial,
  UniformsUtils,
  Vector3,
  Vector4,
  WebGLRenderTarget,
  HalfFloatType,
  NoToneMapping,
  LinearEncoding,
  // SRGBColorSpace,
  UniformsLib,
} from "three";

import VertexShader from "./vert.glsl";

import FragmentShader from "./frag.glsl";

import Loader from "engine/loader";

import BlurPass from "engine/components/blurpass";

import Emitter from "engine/events/emitter";

import Events from "engine/events/events";

import PipeLineMesh from "engine/abstract/pipelinemesh";

class Reflector extends PipeLineMesh {
  constructor(geometry, options) {
    const shader = options.shader || Reflector.ReflectorShader;

    var material = new ShaderMaterial({
      name: "reflector_material",
      uniforms: UniformsUtils.clone(shader.uniforms),
      fragmentShader: shader.fragmentShader,
      vertexShader: shader.vertexShader,
      transparent: true,
      fog: true,
      side: 0,
    });

    if (options.customShaders && options.customShaders.diffuseMaterial) {
      if (options.customShaders.diffuseMaterial.vertexShader) {
        material.vertexShader =
          options.customShaders.diffuseMaterial.vertexShader;
      }

      if (options.customShaders.diffuseMaterial.fragmentShader) {
        material.fragmentShader =
          options.customShaders.diffuseMaterial.fragmentShader;
      }
    }

    super(geometry, material, {
      visibleOnOcclusion: false,
    });

    this.isReflector = true;

    this.renderOrder = -Infinity;

    this.type = "Reflector";

    this.camera = new PerspectiveCamera();

    this.camera.layers.enableAll();

    this.lastURL = null;

    this.isBlur = false;

    const scope = this;

    const color =
      options.color !== undefined
        ? new Color(options.color)
        : new Color(0x777777);
    const textureWidth = options.textureWidth || 1024;
    const textureHeight = options.textureHeight || 1024;
    const clipBias = options.clipBias || 0.0;
    const multisample =
      options.multisample !== undefined ? options.multisample : 0;

    //

    const reflectorPlane = new Plane();
    const normal = new Vector3();
    const reflectorWorldPosition = new Vector3();
    const cameraWorldPosition = new Vector3();
    const rotationMatrix = new Matrix4();
    const lookAtPosition = new Vector3(0, 0, -1);
    const clipPlane = new Vector4();

    const view = new Vector3();
    const target = new Vector3();
    const q = new Vector4();

    const textureMatrix = new Matrix4();
    const virtualCamera = this.camera;

    var renderTarget = new WebGLRenderTarget(textureWidth, textureHeight, {
      samples: multisample,
      type: HalfFloatType,
    });
    var tempTarget = new WebGLRenderTarget(textureWidth, textureHeight, {
      samples: multisample,
      type: HalfFloatType,
    });

    material.uniforms = Object.assign(material.uniforms, UniformsLib.fog);

    // material.uniforms[ 'normalMap' ].value = Textures['bump_texture'];
    material.uniforms["tDiffuse"].value = renderTarget.texture;
    material.uniforms["color"].value = color;
    material.uniforms["textureMatrix"].value = textureMatrix;
    material.uniforms["useNormalMap"].value = 0;

    // if(!Renderer.capabilities.isWebGL2) {

    //     material.extensions = { shaderTextureLOD: true }
    // }

    this.material = material;

    this.onBeforeRender = function (renderer, scene, camera) {
      reflectorWorldPosition.setFromMatrixPosition(scope.matrixWorld);
      cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld);

      rotationMatrix.extractRotation(scope.matrixWorld);

      normal.set(0, 0, 1);

      normal.applyMatrix4(rotationMatrix);

      view.subVectors(reflectorWorldPosition, cameraWorldPosition);

      // Avoid rendering when reflector is facing away

      if (view.dot(normal) > 0) return;

      // console.log('return')

      view.reflect(normal).negate();
      view.add(reflectorWorldPosition);

      rotationMatrix.extractRotation(camera.matrixWorld);

      lookAtPosition.set(0, 0, -1);
      lookAtPosition.applyMatrix4(rotationMatrix);
      lookAtPosition.add(cameraWorldPosition);

      target.subVectors(reflectorWorldPosition, lookAtPosition);
      target.reflect(normal).negate();
      target.add(reflectorWorldPosition);

      // console.log(normal, reflectorWorldPosition)

      virtualCamera.position.copy(view);
      virtualCamera.up.set(0, 1, 0);
      virtualCamera.up.applyMatrix4(rotationMatrix);
      virtualCamera.up.reflect(normal);
      virtualCamera.lookAt(target);

      virtualCamera.far = camera.far; // Used in WebGLBackground

      virtualCamera.updateMatrixWorld();
      virtualCamera.projectionMatrix.copy(camera.projectionMatrix);

      // Update the texture matrix
      textureMatrix.set(
        0.5,
        0.0,
        0.0,
        0.5,
        0.0,
        0.5,
        0.0,
        0.5,
        0.0,
        0.0,
        0.5,
        0.5,
        0.0,
        0.0,
        0.0,
        1.0
      );
      textureMatrix.multiply(virtualCamera.projectionMatrix);
      textureMatrix.multiply(virtualCamera.matrixWorldInverse);
      textureMatrix.multiply(scope.matrixWorld);

      // Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
      // Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
      reflectorPlane.setFromNormalAndCoplanarPoint(
        normal,
        reflectorWorldPosition
      );
      reflectorPlane.applyMatrix4(virtualCamera.matrixWorldInverse);

      clipPlane.set(
        reflectorPlane.normal.x,
        reflectorPlane.normal.y,
        reflectorPlane.normal.z,
        reflectorPlane.constant
      );

      const projectionMatrix = virtualCamera.projectionMatrix;

      q.x =
        (Math.sign(clipPlane.x) + projectionMatrix.elements[8]) /
        projectionMatrix.elements[0];
      q.y =
        (Math.sign(clipPlane.y) + projectionMatrix.elements[9]) /
        projectionMatrix.elements[5];
      q.z = -1.0;
      q.w =
        (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14];

      // Calculate the scaled plane vector
      clipPlane.multiplyScalar(2.0 / clipPlane.dot(q));

      // Replacing the third row of the projection matrix
      projectionMatrix.elements[2] = clipPlane.x;
      projectionMatrix.elements[6] = clipPlane.y;
      projectionMatrix.elements[10] = clipPlane.z + 1.0 - clipBias;
      projectionMatrix.elements[14] = clipPlane.w;

      // Render
      scope.visible = false;

      const currentRenderTarget = renderer.getRenderTarget();

      const activeCubeFace = renderer.getActiveCubeFace();
      const activeMipmapLevel = renderer.getActiveMipmapLevel();

      const currentXrEnabled = renderer.xr.enabled;
      const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;
      const currentOutputEncoding = renderer.outputColorSpace;
      const currentToneMapping = renderer.toneMapping;

      let oldCameraAutoUpdate = camera.matrixWorldAutoUpdate;
      let oldSceneAutoUpdate = scene.matrixWorldAutoUpdate;

      scene.matrixWorldAutoUpdate = false;
      camera.matrixWorldAutoUpdate = false;

      renderer.xr.enabled = false; // Avoid camera modification
      renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows
      renderer.outputColorSpace = LinearEncoding;
      renderer.toneMapping = NoToneMapping;

      renderer.setRenderTarget(renderTarget);

      renderer.state.buffers.depth.setMask(true); // make sure the depth buffer is writable so it can be properly cleared, see #18897

      if (renderer.autoClear === false) renderer.clear();

      Emitter.emit(Events.MIRROR, true);

      scope.visible = false;

      renderer.render(scene, virtualCamera);

      Emitter.emit(Events.MIRROR, false);

      scene.matrixWorldAutoUpdate = oldSceneAutoUpdate;

      camera.matrixWorldAutoUpdate = oldCameraAutoUpdate;
      renderer.xr.enabled = currentXrEnabled;
      renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;
      renderer.outputColorSpace = currentOutputEncoding;
      renderer.toneMapping = currentToneMapping;

      // console.log( scope.isBlur )

      if (scope.isBlur) {
        BlurPass.blur(renderer, camera, renderTarget, tempTarget);

        BlurPass.blur(renderer, camera, renderTarget, tempTarget);
      }

      if (currentRenderTarget?._index) {
        renderer.setRenderTarget(
          currentRenderTarget,
          activeCubeFace,
          activeMipmapLevel
        ); // Restore viewport
      } else {
        renderer.setRenderTarget(currentRenderTarget);
      }

      // Restore viewport

      const viewport = camera.viewport;

      if (viewport !== undefined) {
        renderer.state.viewport(viewport);
      }

      scope.visible = true;
    };

    this.getRenderTarget = function () {
      return renderTarget;
    };

    const _destroy = this.destroy;

    this.destroy = function () {
      renderTarget.dispose();
      scope.material.dispose();

      if (typeof _destroy === "function") {
        _destroy.call(this);
      }
    };
  }

  set blur(val) {
    this.isBlur = val;
  }

  get blur() {
    return this.isBlur;
  }

  set opacity(val) {
    this.material.uniforms.opacity.value = val;
  }

  get opacity() {
    return this.material.uniforms.opacity.value;
  }

  set color(val) {
    this.material.uniforms.color.value.set(val);
  }

  get color() {
    return this.material.uniforms.color.value;
  }

  set useNormalMap(val) {
    this.material.uniforms.useNormalMap.value = val;
  }

  get useNormal() {
    return this.material.uniforms.useNormalMap.value;
  }

  set normalMap(val) {
    if (this.lastURL == val) {
      return;
    }

    if (val != null) {
      Loader.loadTexture(val).then((tex) => {
        tex.needsUpdate = true;

        if (this.lastURL == val) {
          this.material.uniforms.normalMap.value = tex;
        }
      });
    } else {
      this.material.uniforms.normalMap.value = null;
    }

    this.lastURL = val;
  }

  get normalMap() {
    return this.material.uniforms.normalMap.value;
  }

  set normalStrength(val) {
    this.material.uniforms.normalStrength.value = val;
  }

  get normalStrength() {
    return this.material.uniforms.normalStrength.value;
  }

  set tiles(val) {
    this.material.uniforms.tiles.value = val;
  }

  get tiles() {
    return this.material.uniforms.tiles.value;
  }
}

Reflector.ReflectorShader = {
  uniforms: {
    tiles: {
      value: 1,
    },

    normalStrength: {
      value: 0.05,
    },

    useNormalMap: {
      value: 0,
    },

    normalMap: {
      value: null,
    },

    opacity: {
      value: 0.075,
    },

    color: {
      value: null,
    },

    tDiffuse: {
      value: null,
    },

    textureMatrix: {
      value: null,
    },
  },

  vertexShader: VertexShader,

  fragmentShader: FragmentShader,
};

export default Reflector;
