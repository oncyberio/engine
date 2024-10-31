import { LineSegments2 } from "../lines/LineSegments2";
import { LineGeometry } from "../lines/LineGeometry";
import { LineMaterial } from "../lines/LineMaterial";

import PipeLineLines from "@3abstract/pipelinelines";

/**
 * @template {BufferGeometry} G
 * @template {Material | Material[]} M
 *
 * @extends {LineSegments2<G,M>}
 */
class Line2 extends PipeLineLines {
  constructor(
    geometry = new LineGeometry(),
    material = new LineMaterial({ color: Math.random() * 0xffffff })
  ) {
    super(geometry, material, {
      visibleOnDiffuse: true,
      visibleOnOcclusion: true,
      visibleOnMirror: false,
      occlusionMaterial: new LineMaterial({ color: 0x000000 }),
    });

    this.isLine2 = true;

    this.type = "Line2";
  }
}

export { Line2 };
