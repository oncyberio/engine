import Fog from "./fog.js";

class FogFactory {
  get(background, op, sceneFar = 0) {
    const opts = structuredClone(op);

    if (background == null) {
      console.error("FogFactory: background is required");
    }

    let fog = null;

    // auto fog
    if (sceneFar != null && sceneFar > 1400) {
      if (
        opts.fog == null ||
        opts?.fog?.enabled == false ||
        (opts?.fog?.enabled == true && opts?.fog.far > 1400)
      ) {
        opts.fog = {
          enabled: true,
          near: 800,
          far: 1400,
          fadeColor: opts?.fog.color,
        };

        opts.near = 0.5;
      }
    }

    if (opts?.enabled == true) {
      fog = new Fog(background, opts);
    }

    return fog;
  }
}

export default new FogFactory();
