import { Quaternion, Vector3 } from "three";

export function quaternionToAxisAngle(
  q1: Quaternion,
  target: { axis: Vector3; angle: number }
) {
  //
  // if w>1 acos and sqrt will produce errors, this cant happen if quaternion is normalised
  if (q1.w > 1) q1.normalize();

  const axis = target.axis;

  target.angle = 2 * Math.acos(q1.w);

  const s = Math.sqrt(1 - q1.w * q1.w);

  if (s < 0.001) {
    axis.set(q1.x, q1.y, q1.z);
  } else {
    axis.set(q1.x / s, q1.y / s, q1.z / s);
  }

  return target;
}
