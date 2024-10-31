import Wrapper from "./wrapper";

class WaterFactory {
  get(opts = {}) {
    const water = new Wrapper();

    water.rotation.x = -Math.PI / 2;

    if (opts) {
      water.position.copy(opts?.position);

      water.scale.x = opts?.scale.x;

      water.scale.y = opts?.scale.z;

      water.color = opts?.color;

      water.opacity = opts?.opacity;
    }

    water.name = "WATER";

    return water;
  }
}

export default new WaterFactory();
