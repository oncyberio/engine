export var DEFAULT_PIPELINE_OPTIONS = {
  visibleOnDiffuse: true,

  visibleOnOcclusion: true,

  visibleOnMirror: true,

  mirrorMaterial: null,

  occlusionMaterial: null,

  // ==> lighting part

  lightingMaterial: null,

  lightingMirrorMaterial: null,

  lightingOcclusionMaterial: null,

  overrideOcclusionMaterial: null,

  raycastLineWidth: 5,
};

export var DEFAULT_STATE = {
  mirror: false,

  lighting: false,

  occlusion: false,
};
