// @ts-check

import {
  Light,
  Material,
  Mesh,
  RawShaderMaterial,
  ShaderMaterial,
  Sprite,
  Texture,
} from "three";

export function disposeThreeResources(object) {
  if (object.geometry) {
    if (object.dispose != null) {
      object.dispose();
    }

    //
    disposeMesh(object);
  } else if (object instanceof Light) {
    object.dispose();
  } else {
    for (let i = 0; i < object.children.length; i++) {
      disposeThreeResources(object.children[i]);
    }
  }
}

export function disposeMesh(mesh) {
  if (!mesh?.geometry?.userData.isShared) {
    DisposePipelinesMeshes(mesh);

    mesh?.geometry?.dispose();
    // Setting memory to null is good to hunt memory leaks
    // but in production this might lead to a crash
    if (mesh) {
      mesh.geometry = null;
    }
  }

  disposeMaterial(mesh?.material);

  mesh?.dispose?.();
}

export function disposeMaterial(material) {
  if (Array.isArray(material)) {
    material.forEach(disposeMaterial);
  } else if (material instanceof Material) {
    if (material.userData.isShared) return;

    for (let key in material) {
      let value = material[key];

      if (key == "fogTexture") {
        // console.error("trying to destroy fogTexture ");

        continue;
      }

      if (key == "envMap" && value != null) {
        // debugger
      }

      if (
        value &&
        !value.userData?.isShared &&
        typeof value.dispose === "function"
      ) {
        if (value instanceof Texture) {
          // @ts-ignore
          if (value?.renderTarget) {
            // @ts-ignore
            value.renderTarget.dispose();
          }

          // dispose bitmap
          if (value?.source?.data?.close != null) {
            value.source.data.close();
          }
        }

        value.dispose();

        material[key] = null;
      }
    }

    if (
      material instanceof ShaderMaterial ||
      material instanceof RawShaderMaterial
    ) {
      for (let key in material.uniforms) {
        let uni = material.uniforms[key];

        if (key == "fogTexture") {
          // console.log("trying to destroy fogTexture ");

          continue;
        }

        if (uni?.value?.userData?.isShared) continue;

        if (uni?.value?.dispose) {
          uni.value.dispose();
        }

        if (uni?.value?.renderTarget) {
          uni.value.renderTarget.dispose();
        }

        // dispose bitmap
        if (uni?.value?.source?.data?.close != null) {
          uni.value.source.data.close();
        }
      }
    }

    material.dispose();
  }
}

export function disposeObject3D(object) {
  if (object instanceof Mesh || object instanceof Sprite) {
    disposeMesh(object);
  } else if (object instanceof Light) {
    // @ts-ignore
    object.dispose();
  } else {
    for (let i = 0; i < object.children.length; i++) {
      disposeObject3D(object.children[i]);
    }
  }
}

export function disposePipelineTextures(material) {
  if (material instanceof Material) {
    if (material.userData.isShared) return;

    for (let key in material) {
      let value = material[key];

      if (key == "fogTexture") {
        // console.error("trying to destroy fogTexture ");

        continue;
      }

      if (key == "envMap" && value != null) {
        // debugger
      }

      if (
        value &&
        !value.userData?.isShared &&
        typeof value.dispose === "function"
      ) {
        if (value instanceof Texture) {
          // @ts-ignore
          if (value?.renderTarget) {
            // @ts-ignore
            value.renderTarget.dispose();
          }

          // dispose bitmap
          if (value?.source?.data?.close != null) {
            value.source.data.close();
          }
        }

        value.dispose();

        material[key] = null;
      }
    }

    if (
      material instanceof ShaderMaterial ||
      material instanceof RawShaderMaterial
    ) {
      for (let key in material.uniforms) {
        let uni = material.uniforms[key];

        if (key == "fogTexture") {
          // console.log("trying to destroy fogTexture ");

          continue;
        }

        if (uni?.value?.userData?.isShared) continue;

        if (uni?.value?.dispose) {
          uni.value.dispose();
        }

        if (uni?.value?.renderTarget) {
          uni.value.renderTarget.dispose();
        }

        // dispose bitmap
        if (uni?.value?.source?.data?.close != null) {
          uni.value.source.data.close();
        }
      }
    }
  }
}

export function DisposePipelinesMeshes(mesh, ignoreMap = false) {
  if (mesh == null) {
    return;
  }

  if (mesh.diffuseMaterials?.material) {
    // check if material is an array of materials

    if (mesh.diffuseMaterials.material instanceof Array) {
      mesh.diffuseMaterials.material.forEach((material) => {
        material.dispose();
        if (ignoreMap == false) {
          disposePipelineTextures(material);
        }
      });
    } else {
      mesh.diffuseMaterials.material.dispose();
      if (ignoreMap == false) {
        disposePipelineTextures(mesh.diffuseMaterials.material);
      }
    }
  }

  if (mesh.diffuseMaterials?.occlusionMaterial) {
    // check if occlusionMaterial is an array of materials

    if (mesh.diffuseMaterials.occlusionMaterial instanceof Array) {
      mesh.diffuseMaterials.occlusionMaterial.forEach((material) => {
        material.dispose();
        if (ignoreMap == false) {
          disposePipelineTextures(material);
        }
      });
    } else {
      mesh.diffuseMaterials.occlusionMaterial.dispose();
      if (ignoreMap == false) {
        disposePipelineTextures(mesh.diffuseMaterials.occlusionMaterial);
      }
    }
  }

  if (mesh.diffuseMaterials?.mirrorMaterial) {
    // check if material is an array of materials

    if (mesh.diffuseMaterials.mirrorMaterial instanceof Array) {
      mesh.diffuseMaterials.mirrorMaterial.forEach((material) => {
        material.dispose();
        if (ignoreMap == false) {
          disposePipelineTextures(material);
        }
      });
    } else {
      mesh.diffuseMaterials.mirrorMaterial.dispose();
      if (ignoreMap == false) {
        disposePipelineTextures(mesh.diffuseMaterials.mirrorMaterial);
      }
    }
  }

  if (mesh.lightingMaterials?.material) {
    // check if material is an array of materials

    if (mesh.lightingMaterials.material instanceof Array) {
      mesh.lightingMaterials.material.forEach((material) => {
        material.dispose();
        if (ignoreMap == false) {
          disposePipelineTextures(material);
        }
      });
    } else {
      mesh.lightingMaterials.material.dispose();
      if (ignoreMap == false) {
        disposePipelineTextures(mesh.lightingMaterials.material);
      }
    }
  }

  if (mesh.lightingMaterials?.occlusionMaterial) {
    // check if occlusionMaterial is an array of materials

    if (mesh.lightingMaterials.occlusionMaterial instanceof Array) {
      mesh.lightingMaterials.occlusionMaterial.forEach((material) => {
        material.dispose();
        if (ignoreMap == false) {
          disposePipelineTextures(material);
        }
      });
    } else {
      mesh.lightingMaterials.occlusionMaterial.dispose();
      if (ignoreMap == false) {
        disposePipelineTextures(mesh.lightingMaterials.occlusionMaterial);
      }
    }
  }

  if (mesh.lightingMaterials?.mirrorMaterial) {
    // check if material is an array of materials

    if (mesh.lightingMaterials.mirrorMaterial instanceof Array) {
      mesh.lightingMaterials.mirrorMaterial.forEach((material) => {
        material.dispose();
        if (ignoreMap == false) {
          disposePipelineTextures(material);
        }
      });
    } else {
      mesh.lightingMaterials.mirrorMaterial.dispose();
      if (ignoreMap == false) {
        disposePipelineTextures(mesh.lightingMaterials.mirrorMaterial);
      }
    }
  }

  if (mesh.customDepthMaterial) {
    mesh.customDepthMaterial.dispose();

    if (ignoreMap == false) {
      disposePipelineTextures(mesh.customDepthMaterial);
    }
  }

  if (mesh.geometry) {
    mesh.geometry.dispose();

    mesh.geometry = null;
  }
}
