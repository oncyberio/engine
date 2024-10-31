import { Vector3 } from "three";

const currentLookAt = new Vector3();
const targetLookAt = new Vector3();
const targetPos = new Vector3();

export function getIdealView(
  camera,
  component,
  opts = { withDirection: true }
) {
  // original pov
  camera.getWorldDirection(currentLookAt);
  currentLookAt.multiplyScalar(3);
  currentLookAt.add(camera.position);

  const from = {
    target: currentLookAt,
    position: camera.position.clone(),
  };
  // original pov

  // target pos

  component.getWorldDirection(targetPos);
  targetPos.multiplyScalar(-15);
  targetPos.add(component.position);

  // target pos

  // target look at //

  targetLookAt.copy(component.position);

  // targetLookAt

  // offset head pos

  if (component._avatar != null) {
    const offset = component._avatar.vrm.vrmBBox.max.y;
    targetLookAt.y += offset * component._avatar.scale.y - 2;

    console.log(targetLookAt);
    targetPos.y += offset * component._avatar.scale.y;
  }

  // offset head pos

  const to = {
    target: targetLookAt,
    position: targetPos,
  };

  return { from, to };
}
