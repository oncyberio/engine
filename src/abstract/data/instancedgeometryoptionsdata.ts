import { Sphere } from "three";

/**
 * @public
 *
 * Data specification for InstancedGeometryOptionsData
 */
export interface InstancedGeometryOptionsData {
  /**
   * instanced geometry use the scale attribute
   */
  scale: boolean;

  /**
   * instanced geometry use opacity attribute
   */
  opacity: boolean;

  /**
   * instanced geometry use normal attribute
   */
  useNormal: boolean;

  /**
   * instanced geometry use normal attribute
   */
  rotation: boolean;

  /**
   * instanced geometry use rotation only on the Y axis
   */

  rotationY: boolean;

  /**
   * instanced geometry use a color value per instance
   */
  color: boolean;

  /**
   * instanced geometry use an atlas for the textures
   */
  atlas: true;

  /**
   * Bounding Sphere for the instanced geometry
   */
  boundingSphere: Sphere;

  /**
   * Using the reverse-painter alorithm for transparency sorting
   */
  transparencySorting: boolean;

  /**
   * using dynamic shadow on this instanced geometry
   */
  shadow: string;

  /**
   * using a custom sorting strategy for the instanced geometry
   */
  sorter: any;

  /**
   * @internal
   */
  copyBuffer: Array<number>;
  /**
   * name of the instanced geometry
   */
  name: string;
}
