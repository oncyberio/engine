import type { Component3D } from "engine/abstract/component3D";

export interface ComponentMixin {
  init(component: Component3D): Promise<void>;

  update(): void;

  dispose(component: Component3D): void;
}
