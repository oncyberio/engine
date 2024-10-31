import type { Component3D } from "engine/abstract/component3D";
import { BaseIntersectionEvent } from "./constants";

export class IntersectionEvent implements BaseIntersectionEvent {
  constructor(
    public readonly me: Component3D,
    public readonly other: Component3D,
    public frame: number
  ) {}
}
