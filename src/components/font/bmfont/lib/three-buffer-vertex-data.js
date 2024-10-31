import { BufferAttribute } from "three";

function setIndex(geometry, data, itemSize, dtype) {
  if (typeof itemSize !== "number") itemSize = 1;
  if (typeof dtype !== "string") dtype = "uint16";

  const isR69 = !geometry.index && typeof geometry.setIndex !== "function";
  const attrib = isR69 ? geometry.getAttribute("index") : geometry.index;
  const newAttrib = updateAttribute(attrib, data, itemSize, dtype);

  if (newAttrib) {
    if (isR69) geometry.setAttribute("index", newAttrib);
    else geometry.index = newAttrib;
  }
}

function setAttribute(geometry, key, data, itemSize, dtype) {
  if (typeof itemSize !== "number") itemSize = 3;
  if (typeof dtype !== "string") dtype = "float32";
  if (
    Array.isArray(data) &&
    Array.isArray(data[0]) &&
    data[0].length !== itemSize
  ) {
    throw new Error(
      `Nested vertex array has unexpected size; expected ${itemSize} but found ${data[0].length}`
    );
  }

  const attrib = geometry.getAttribute(key);
  const newAttrib = updateAttribute(attrib, data, itemSize, dtype);

  if (!newAttrib) {
    geometry.deleAttribute(key);
  }
  geometry.setAttribute(key, newAttrib);
}

function updateAttribute(attrib, data, itemSize, dtype) {
  return new BufferAttribute(data, itemSize);
}

// Test whether the attribute needs to be re-created,
// returns false if we can re-use it as-is.
function rebuildAttribute(attrib, data, itemSize) {
  if (attrib.itemSize !== itemSize) return true;
  if (!attrib.array) return true;
  const attribLength = attrib.array.length;

  if (Array.isArray(data) && Array.isArray(data[0])) {
    // [ [ x, y, z ] ]
    return attribLength !== data.length * itemSize;
  }
  // [ x, y, z ]
  return attribLength !== data.length;
}

export default {
  attr: setAttribute,
  index: setIndex,
};
