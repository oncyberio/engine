import { Camera, Object3D, Vector3 } from "three";

const tmpVec3 = new Vector3();

/**
 * Translates the object on the axis perpendicular to the camera-to-object vector on the XZ plane
 */
export function offsetHorz(
  object: Object3D,
  camera: Camera,
  offset: number,
  target: Vector3 = new Vector3()
) {
  tmpVec3.subVectors(object.position, camera.position).normalize();

  // Calculate the lateral offset vector (perpendicular on the XZ plane)
  // if offset is to the right otherwise to the left
  tmpVec3.cross(camera.up);

  // Apply the offset
  target.addScaledVector(tmpVec3, offset);

  return target;
}
