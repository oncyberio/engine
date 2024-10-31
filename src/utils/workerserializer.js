import { BufferGeometry, BufferAttribute, Box3, Matrix4 } from "three";

export function serializeBufferGeometry(geometry) {
  const attributes = {};
  for (let name in geometry.attributes) {
    attributes[name] = {
      array: geometry.attributes[name].array.buffer,
      itemSize: geometry.attributes[name].itemSize,
      normalized: geometry.attributes[name].normalized,
      type: geometry.attributes[name].array.constructor.name,
    };
  }

  return {
    attributes,
    index: geometry.index
      ? {
          array: geometry.index.array.buffer,
          type: geometry.index.array.constructor.name,
        }
      : null,
  };
}

export function deserializeBufferGeometry(data) {
  const geometry = new BufferGeometry();

  // Deserialize attributes
  for (let name in data.attributes) {
    const attrData = data.attributes[name];
    const TypedArray = getTypedArrayConstructor(attrData.type);
    const typedArray = new TypedArray(attrData.array);
    const bufferAttribute = new BufferAttribute(
      typedArray,
      attrData.itemSize,
      attrData.normalized
    );
    geometry.setAttribute(name, bufferAttribute);
  }

  // Deserialize index if present
  if (data.index) {
    const TypedIndexArray = getTypedArrayConstructor(data.index.type);
    const typedIndexArray = new TypedIndexArray(data.index.array);
    geometry.setIndex(new BufferAttribute(typedIndexArray, 1));
  }

  return geometry;
}

function getTypedArrayConstructor(type) {
  switch (type) {
    case "Float32Array":
      return Float32Array;
    case "Uint32Array":
      return Uint32Array;
    case "Uint16Array":
      return Uint16Array;
    case "Int32Array":
      return Int32Array;
    case "Int16Array":
      return Int16Array;
    case "Float64Array":
      return Float64Array;
    // ... add other typed arrays as needed
    default:
      throw new Error(`Unsupported typed array: ${type}`);
  }
}

export function serializeMatrix4(matrix) {
  return Array.from(matrix.elements);
}

export function deserializeMatrix4(data) {
  return new Matrix4().fromArray(data);
}

export function serializeBox3(box) {
  return {
    min: [box.min.x, box.min.y, box.min.z],
    max: [box.max.x, box.max.y, box.max.z],
  };
}

export function deserializeBox3(data) {
  const box = new Box3();

  box.min.set(data.min[0], data.min[1], data.min[2]);
  box.max.set(data.max[0], data.max[1], data.max[2]);

  return box;
}
