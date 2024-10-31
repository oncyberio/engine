import type * as RAPIER from "@dimforge/rapier3d";

let _RAPIER: typeof RAPIER = null;

export async function getRapier(): Promise<typeof RAPIER> {
  if (_RAPIER == null) {
    _RAPIER = await import("@dimforge/rapier3d");
  }

  if (__BUILD_TARGET__ === "node") {
    // @ts-ignore
    await _RAPIER.init();
  }

  return _RAPIER;
}
