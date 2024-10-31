import {
  Vector3,
  Plane,
  Color,
  UniformsLib,
  Matrix4,
  FrontSide,
  PerspectiveCamera,
  UniformsUtils,
  Vector4,
  WebGLRenderTarget,
  ShaderMaterial,
} from "three";

import { FBO_DEBUG } from "engine/constants";

import Emitter from "engine/events/emitter";

import Events from "engine/events/events";

import Shared from "engine/globals/shared";

import FBOHelper from "engine/globals/fbohelper.js";

import PipeLineMesh from "engine/abstract/pipelinemesh";

import { DisposePipelinesMeshes } from "engine/utils/dispose.js";

export default class Water extends PipeLineMesh {
  constructor(geometry, options = {}) {
    const textureWidth =
      options.textureWidth !== undefined ? options.textureWidth : 512;
    const textureHeight =
      options.textureHeight !== undefined ? options.textureHeight : 512;
    const clipBias = options.clipBias !== undefined ? options.clipBias : 0.0;
    const alpha = options.alpha !== undefined ? options.alpha : 1.0;
    const time = options.time !== undefined ? options.time : 0.0;
    const normalSampler =
      options.waterNormals !== undefined ? options.waterNormals : null;
    const sunDirection =
      options.sunDirection !== undefined
        ? options.sunDirection
        : new Vector3(0.70707, 0.70707, 0.0);
    const sunColor = new Color(
      options.sunColor !== undefined ? options.sunColor : 0xffffff
    );
    const waterColor = new Color(
      options.waterColor !== undefined ? options.waterColor : 0x7f7f7f
    );
    const eye = options.eye !== undefined ? options.eye : new Vector3(0, 0, 0);
    const distortionScale =
      options.distortionScale !== undefined ? options.distortionScale : 20.0;
    const side = options.side !== undefined ? options.side : FrontSide;
    const fog = options.fog !== undefined ? options.fog : false; //

    const mirrorPlane = new Plane();
    const normal = new Vector3();
    const mirrorWorldPosition = new Vector3();
    const cameraWorldPosition = new Vector3();
    const rotationMatrix = new Matrix4();
    const lookAtPosition = new Vector3(0, 0, -1);
    const clipPlane = new Vector4();
    const view = new Vector3();
    const target = new Vector3();
    const q = new Vector4();
    const textureMatrix = new Matrix4();
    const mirrorCamera = new PerspectiveCamera();

    mirrorCamera.layers.enableAll();

    mirrorCamera.isMirrorCamera = true;

    const renderTarget = new WebGLRenderTarget(textureWidth, textureHeight, {
      // stencilBuffer: true
      stencilBuffer: false,
    });

    if (FBO_DEBUG) {
      FBOHelper.attach(renderTarget, "water target");
    }

    // this.renderTarget = renderTarget

    const mirrorShader = {
      uniforms: UniformsUtils.merge([
        UniformsLib["fog"],
        UniformsLib["lights"],
        {
          normalSampler: {
            value: null,
          },
          mirrorSampler: {
            value: null,
          },
          alpha: {
            value: 1.0,
          },
          time: {
            value: 0.0,
          },
          size: {
            value: 1.0,
          },
          distortionScale: {
            value: 20.0,
          },
          textureMatrix: {
            value: new Matrix4(),
          },
          sunColor: {
            value: new Color(0x7f7f7f),
          },
          sunDirection: {
            value: new Vector3(0.70707, 0.70707, 0),
          },
          eye: {
            value: new Vector3(),
          },
          waterColor: {
            value: new Color(0x555555),
          },
        },
      ]),
      vertexShader:
        /* glsl */
        `
			uniform mat4 textureMatrix;
			uniform float time;

			varying vec4 mirrorCoord;
			varying vec4 worldPosition;

			#include <common>
			#include <fog_pars_vertex>
			#include <shadowmap_pars_vertex>
			#include <logdepthbuf_pars_vertex>

			void main() {
				mirrorCoord = modelMatrix * vec4( position, 1.0 );
				worldPosition = mirrorCoord.xyzw;
				mirrorCoord = textureMatrix * mirrorCoord;
				vec4 mvPosition =  modelViewMatrix * vec4( position, 1.0 );
				gl_Position = projectionMatrix * mvPosition;

			#include <beginnormal_vertex>
			#include <defaultnormal_vertex>
			#include <logdepthbuf_vertex>
			#include <fog_vertex>
			#include <shadowmap_vertex>
		}`,
      fragmentShader:
        /* glsl */
        `
			uniform sampler2D mirrorSampler;
			uniform float alpha;
			uniform float time;
			uniform float size;
			uniform float distortionScale;
			uniform sampler2D normalSampler;
			uniform vec3 sunColor;
			uniform vec3 sunDirection;
			uniform vec3 eye;
			uniform vec3 waterColor;

			uniform float isScreenShotRendering;
			uniform float isDynamicRendering;

			varying vec4 mirrorCoord;
			varying vec4 worldPosition;

			vec4 when_lt(vec4 x, vec4 y) {
			  return max(sign(y - x), 0.0);
			}

			vec4 SRGBToLinear(vec4 sRGB)
			{
			    vec4 cutoff = when_lt(sRGB, vec4(0.04045));
			    vec4 higher = pow((sRGB + vec4(0.055))/vec4(1.055), vec4(2.4));
			    vec4 lower = sRGB/vec4(12.92);

			    return mix(higher, lower, cutoff);

			}

			vec4 getNoise( vec2 uv ) {
				vec2 uv0 = ( uv / 103.0 ) + vec2(time / 17.0, time / 29.0);
				vec2 uv1 = uv / 107.0-vec2( time / -19.0, time / 31.0 );
				vec2 uv2 = uv / vec2( 8907.0, 9803.0 ) + vec2( time / 101.0, time / 97.0 );
				vec2 uv3 = uv / vec2( 1091.0, 1027.0 ) - vec2( time / 109.0, time / -113.0 );
				vec4 noise = texture2D( normalSampler, uv0 ) +
					texture2D( normalSampler, uv1 ) +
					texture2D( normalSampler, uv2 ) +
					texture2D( normalSampler, uv3 );
				return noise * 0.5 - 1.0;
			}

			void sunLight( const vec3 surfaceNormal, const vec3 eyeDirection, float shiny, float spec, float diffuse, inout vec3 diffuseColor, inout vec3 specularColor ) {
				vec3 reflection = normalize( reflect( -sunDirection, surfaceNormal ) );
				float direction = max( 0.0, dot( eyeDirection, reflection ) );
				specularColor += pow( direction, shiny ) * sunColor * spec;
				diffuseColor += max( dot( sunDirection, surfaceNormal ), 0.0 ) * sunColor * diffuse;
			}

			#include <common>
			#include <packing>
			#include <bsdfs>
			#include <fog_pars_fragment>
			#include <logdepthbuf_pars_fragment>
			#include <lights_pars_begin>
			#include <shadowmap_pars_fragment>
			#include <shadowmask_pars_fragment>

			void main() {

				#include <logdepthbuf_fragment>
				vec4 noise = getNoise( worldPosition.xz * size );
				vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5 ) );

				vec3 diffuseLight = vec3(0.0);
				vec3 specularLight = vec3(0.0);

				vec3 worldToEye = eye-worldPosition.xyz;
				vec3 eyeDirection = normalize( worldToEye );
				sunLight( surfaceNormal, eyeDirection, 100.0, 2.0, 0.5, diffuseLight, specularLight );

				float distance = length(worldToEye);

				vec2 distortion = surfaceNormal.xz * ( 0.001 + 1.0 / distance ) * distortionScale;
				vec3 reflectionSample = vec3( texture2D( mirrorSampler, mirrorCoord.xy / mirrorCoord.w + distortion ) );

				float theta = max( dot( eyeDirection, surfaceNormal ), 0.0 );
				float rf0 = 0.3;
				float reflectance = rf0 + ( 1.0 - rf0 ) * pow( ( 1.0 - theta ), 5.0 );
				vec3 scatter = max( 0.0, dot( surfaceNormal, eyeDirection ) ) * waterColor;
				float shadowMask = getShadowMask();
				vec3 albedo = mix( ( sunColor * diffuseLight * 0.3 + scatter ) * shadowMask, ( vec3( 0.1 ) + reflectionSample * 0.9 + reflectionSample * specularLight ), reflectance);
				vec3 outgoingLight = albedo;
				gl_FragColor = vec4( outgoingLight * mix(0.5, 1.0, shadowMask), alpha );

				#include <tonemapping_fragment>
				


				if( max(isScreenShotRendering, isDynamicRendering) == 1.0 ){

					gl_FragColor = SRGBToLinear(gl_FragColor);
				}

				#include <fog_fragment>

				

				
			}`,
    };

    const material = new ShaderMaterial({
      name: "water_material",
      fragmentShader: mirrorShader.fragmentShader,
      vertexShader: mirrorShader.vertexShader,
      uniforms: UniformsUtils.clone(mirrorShader.uniforms),
      lights: true,
      side: side,
      fog: fog,
      transparent: true,
    });

    material.uniforms.isScreenShotRendering = Shared.isScreenShotRendering;
    material.uniforms.isDynamicRendering = Shared.isDynamicRendering;

    material.uniforms["mirrorSampler"].value = renderTarget.texture;
    material.uniforms["textureMatrix"].value = textureMatrix;
    material.uniforms["alpha"].value = alpha;
    material.uniforms["time"].value = time;
    material.uniforms["normalSampler"].value = normalSampler;
    material.uniforms["sunColor"].value = sunColor;
    material.uniforms["waterColor"].value = waterColor;
    material.uniforms["sunDirection"].value = sunDirection;
    material.uniforms["distortionScale"].value = distortionScale;
    material.uniforms["eye"].value = eye;

    super(geometry, material, {
      visibleOnOcclusion: false,
      visibleOnMirror: false,
    });

    // globalThis.water = this;

    // wata.visible = false
    this.renderOrder = -999999999;

    const scope = this;

    scope.material = material;

    this.renderTarget = renderTarget;

    scope.onBeforeRender = function (renderer, scene, camera) {
      const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;

      // if( currentShadowAutoUpdate == true ) {

      // 	return
      // }

      // console.log(Shared.isScreenShotRendering.value)

      //

      mirrorWorldPosition.setFromMatrixPosition(scope.matrixWorld);
      cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld);
      rotationMatrix.extractRotation(scope.matrixWorld);
      normal.set(0, 0, 1);
      normal.applyMatrix4(rotationMatrix);
      view.subVectors(mirrorWorldPosition, cameraWorldPosition); // Avoid rendering when mirror is facing away

      if (view.dot(normal) > 0) return;
      view.reflect(normal).negate();
      view.add(mirrorWorldPosition);
      rotationMatrix.extractRotation(camera.matrixWorld);
      lookAtPosition.set(0, 0, -1);
      lookAtPosition.applyMatrix4(rotationMatrix);
      lookAtPosition.add(cameraWorldPosition);
      target.subVectors(mirrorWorldPosition, lookAtPosition);
      target.reflect(normal).negate();
      target.add(mirrorWorldPosition);
      mirrorCamera.position.copy(view);
      mirrorCamera.up.set(0, 1, 0);
      mirrorCamera.up.applyMatrix4(rotationMatrix);
      mirrorCamera.up.reflect(normal);
      mirrorCamera.lookAt(target);
      mirrorCamera.far = camera.far; // Used in WebGLBackground

      mirrorCamera.updateMatrixWorld();
      mirrorCamera.projectionMatrix.copy(camera.projectionMatrix); // Update the texture matrix

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
      textureMatrix.multiply(mirrorCamera.projectionMatrix);
      textureMatrix.multiply(mirrorCamera.matrixWorldInverse); // Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
      // Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf

      mirrorPlane.setFromNormalAndCoplanarPoint(normal, mirrorWorldPosition);
      mirrorPlane.applyMatrix4(mirrorCamera.matrixWorldInverse);
      clipPlane.set(
        mirrorPlane.normal.x,
        mirrorPlane.normal.y,
        mirrorPlane.normal.z,
        mirrorPlane.constant
      );
      const projectionMatrix = mirrorCamera.projectionMatrix;
      q.x =
        (Math.sign(clipPlane.x) + projectionMatrix.elements[8]) /
        projectionMatrix.elements[0];
      q.y =
        (Math.sign(clipPlane.y) + projectionMatrix.elements[9]) /
        projectionMatrix.elements[5];
      q.z = -1.0;
      q.w =
        (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14]; // Calculate the scaled plane vector

      clipPlane.multiplyScalar(2.0 / clipPlane.dot(q)); // Replacing the third row of the projection matrix

      projectionMatrix.elements[2] = clipPlane.x;
      projectionMatrix.elements[6] = clipPlane.y;
      projectionMatrix.elements[10] = clipPlane.z + 1.0 - clipBias;
      projectionMatrix.elements[14] = clipPlane.w;
      eye.setFromMatrixPosition(camera.matrixWorld); // Render

      const currentRenderTarget = renderer.getRenderTarget();

      const activeCubeFace = renderer.getActiveCubeFace();
      const activeMipmapLevel = renderer.getActiveMipmapLevel();

      const currentXrEnabled = renderer.xr.enabled;
      // const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;
      const previousAutoUpdateScene = scene.matrixWorldAutoUpdate;

      let oldCameraAutoUpdate = camera.matrixWorldAutoUpdate;

      camera.matrixWorldAutoUpdate = false;
      scene.matrixWorldAutoUpdate = false;
      scope.visible = false;
      renderer.xr.enabled = false; // Avoid camera modification and recursion

      renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows

      renderer.setRenderTarget(renderTarget);
      renderer.state.buffers.depth.setMask(true); // make sure the depth buffer is writable so it can be properly cleared, see #18897

      if (renderer.autoClear === false) renderer.clear();

      // if (globalThis.firstShadowRender) {
      //     // debugger;
      // }

      Emitter.emit(Events.MIRROR, true);

      scope.visible = false;

      renderer.render(scene, mirrorCamera);

      Emitter.emit(Events.MIRROR, false);

      scope.visible = true;

      camera.matrixWorldAutoUpdate = oldCameraAutoUpdate;

      scene.matrixWorldAutoUpdate = previousAutoUpdateScene;

      renderer.xr.enabled = currentXrEnabled;
      renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;

      if (currentRenderTarget?._index) {
        renderer.setRenderTarget(
          currentRenderTarget,
          activeCubeFace,
          activeMipmapLevel
        ); // Restore viewport
      } else {
        renderer.setRenderTarget(currentRenderTarget);
      }

      const viewport = camera.viewport;

      if (viewport !== undefined) {
        renderer.state.viewport(viewport);
      }
    };
  }

  extraDispose() {}

  dispose() {
    super.dispose();

    if (FBO_DEBUG) {
      FBOHelper.detach(this.renderTarget);
    }

    console.log(this.renderTarget);

    if (this.renderTarget) {
      this.renderTarget.dispose();

      this.renderTarget = null;
    }

    DisposePipelinesMeshes(this);
  }
}
