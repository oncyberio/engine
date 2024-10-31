import Smoothstep from "./smoothstep.js";

import Mix from "./mix.js";

const Remap = function remap(inMin, inMax, outMin, outMax, value) {
  return Mix(outMin, outMax, Smoothstep(inMin, inMax, value));
};

export default Remap;
