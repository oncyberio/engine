// @ts-check

import Triangle from "./triangle.js";

import { Mesh, Scene, ShaderMaterial, Vector2 } from "three";

import VertexShader from "./shaders/blur.vert";

import FragmentShader from "./shaders/blur.frag";

class BlurPass {
  constructor() {
    this.material = new ShaderMaterial({
      vertexShader: VertexShader,

      fragmentShader: FragmentShader,

      uniforms: {
        tInput: { value: null },

        direction: { value: new Vector2(0, 0) },
      },

      depthTest: false,

      depthWrite: false,
    });

    // if(renderer.getContext().getParameter(renderer.getContext().MAX_VARYING_VECTORS) > 15){

    // 	this.material.defines['USE_VARYING'] = '1'
    // }

    this.mesh = new Mesh(Triangle, this.material);

    this.mesh.frustumCulled = false;

    this.mesh.matrixAutoUpdate = false;

    this.scene = new Scene();

    this.scene.matrixWorldAutoUpdate = false;

    this.scene.add(this.mesh);

    // console.log(this.material)
  }

  blur(renderer, camera, input, temp, iteration = 8) {
    var currentAutoClear = renderer.autoClear;

    renderer.autoClear = false;

    var currentRenderTarget = renderer.getRenderTarget();

    var currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;

    renderer.shadowMap.autoUpdate = false;

    this.material.uniforms.direction.value.set(1 / input.width, 0);

    this.material.uniforms.tInput.value = input.texture;

    renderer.setRenderTarget(temp);

    renderer.render(this.scene, camera);

    this.material.uniforms.direction.value.set(0, 1 / input.height);

    this.material.uniforms.tInput.value = temp.texture;

    renderer.setRenderTarget(input);

    renderer.render(this.scene, camera);

    renderer.setRenderTarget(currentRenderTarget);

    renderer.autoClear = currentAutoClear;

    renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;
  }
}

export default new BlurPass();
