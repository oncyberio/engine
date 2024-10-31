import { Vector3 } from "three";

let vec = new Vector3();

let pos = new Vector3();

function to3DPosition(x, y, camera, target) {
  vec.set(x, y, 0.5);

  vec.unproject(camera);

  vec.sub(camera.position).normalize();

  var distance = (target - camera.position.z) / vec.z;

  pos.copy(camera.position).add(vec.multiplyScalar(distance));

  return pos;
}

export { to3DPosition };
