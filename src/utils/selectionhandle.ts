import {
  BoxGeometry,
  Color,
  EdgesGeometry,
  InstancedInterleavedBuffer,
  InterleavedBufferAttribute,
  Vector3,
} from "three";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import PipeLineLines from "engine/abstract/pipelinelines";
import { LineMaterial2 } from "engine/utils/lines/linematerial2";

const _start = new Vector3();
const _end = new Vector3();
const _temp = new Vector3();
/**
 *
 * @param { Mesh } mesh
 * @param { Color | number } color
 * @param { number } linewidth
 */

function computeLineDistancesWorld() {
  const matrixWorld = this.matrixWorld;
  const geometry = this.geometry;

  // @type {Matrix4}

  // _temp.setFromMatrixScale(matrixWorld)

  const instanceStart = geometry.attributes.instanceStart;
  const instanceEnd = geometry.attributes.instanceEnd;
  const lineDistances = new Float32Array(2 * instanceStart.count);

  for (let i = 0, j = 0, l = instanceStart.count; i < l; i++, j += 2) {
    _start.fromBufferAttribute(instanceStart, i);
    _end.fromBufferAttribute(instanceEnd, i);

    _start.applyMatrix4(matrixWorld);
    _end.applyMatrix4(matrixWorld);

    lineDistances[j] = j === 0 ? 0 : lineDistances[j - 1];
    lineDistances[j + 1] = lineDistances[j] + _start.distanceTo(_end);
  }

  const instanceDistanceBuffer = new InstancedInterleavedBuffer(
    lineDistances,
    2,
    1
  ); // d0, d1

  geometry.setAttribute(
    "instanceDistanceStart",
    new InterleavedBufferAttribute(instanceDistanceBuffer, 1, 0)
  ); // d0
  geometry.setAttribute(
    "instanceDistanceEnd",
    new InterleavedBufferAttribute(instanceDistanceBuffer, 1, 1)
  ); // d1

  return this;
}

export function getSelectionHandle(
  mesh,
  color,
  linewidth = 2,
  opacity = 1,
  dashed = false,
  transparent = false,
  dashScale = 4,
  gapSize = 1
) {
  if (mesh.geometry.boundingBox == null) {
    mesh.geometry.computeBoundingBox();
  }

  const box = mesh.geometry.boundingBox;

  const boxGeo = new BoxGeometry(
    box.max.x - box.min.x,
    box.max.y - box.min.y,
    box.max.z - box.min.z
  );

  boxGeo.translate(
    (box.max.x + box.min.x) / 2,
    (box.max.y + box.min.y) / 2,
    (box.max.z + box.min.z) / 2
  );

  const edges = new EdgesGeometry(boxGeo);

  let geometry = new LineSegmentsGeometry().fromEdgesGeometry(edges);

  if (color instanceof Color) {
    color = color.getHex();
  }

  const material = new LineMaterial2({
    color,
    linewidth,
    opacity,
    dashScale: dashScale,
    gapSize: gapSize,
    dashed: dashed,
    transparent: transparent,
    // depthTest: false,
    // depthWrite: false,
  });

  const border = new PipeLineLines(geometry, material, {
    visibleOnOcclusion: false,
    visibleOnMirror: false,
  });

  if (dashed) {
    border.computeLineDistances = computeLineDistancesWorld;

    border.dashed = dashed;

    border.computeLineDistances();
  }

  return border;
}
