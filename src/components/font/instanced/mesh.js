import InstancedPipelineMesh from "engine/abstract/instancedpipelinemesh";

import InstancedGeometry from "engine/abstract/instancedgeometry";

import { PlaneGeometry } from "three";

import FontPlugin from "./plugin.js";

export default class InstancedFontMesh extends InstancedPipelineMesh {
  constructor(args) {
    var baseGeometry = new PlaneGeometry(2, 2);

    baseGeometry.translate(0.0, 0, 0);

    baseGeometry.scale(1, 1, 1);

    baseGeometry.deleteAttribute("normal");

    super(
      new InstancedGeometry(baseGeometry, {
        scale: true,

        opacity: true,

        color: true,

        rotation: args.instanceBillBoard ? false : true,

        boundingSphere: baseGeometry.boundingSphere,

        transparencySorting: true,

        name: "font_instance_geometry",

        plugins: [FontPlugin],
      }),

      args.material,

      {
        visibleOnOcclusion: false,

        visibleOnMirror: false,

        type: "FONT_INSTANCED",
      }
    );
  }
}
