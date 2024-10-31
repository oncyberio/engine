/**
 * @public
 *
 * This is a shared interface used to represent various 3D coordinates in component data (position, rotation, scale ...)
 */
export interface XYZ {
  x: number;
  y: number;
  z: number;
}

export type RenderMode = "default" | "toon" | "glitch" | "ghost";
