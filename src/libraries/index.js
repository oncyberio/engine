import InstanceOpacityPlugin from "./visuals/instanceopacity";
import ScreenMaterial from "./materials/screen";
import OctreeSorter from "./sorters/octree/";

export const Plugins = {
  VISUALS: {
    InstanceOpacityPlugin,
  },
  MATERIALS: {
    ScreenMaterial,
  },

  SORTERS: {
    OctreeSorter,
  },
};

export const getPluginFromName = (name) => {
  let plugin = null;

  for (let key in Plugins) {
    if (Plugins[key][name] != null) {
      plugin = Plugins[key][name];
    }
  }

  return plugin;
};
