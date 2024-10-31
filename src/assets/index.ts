import assetsJSON from "./assets.json";

type AssetsJSON = typeof assetsJSON;

type Scope = keyof AssetsJSON;

export interface ImageOpts {
  id: string;
  image: string;
  path: string;
}

class AssetsManager {
  //
  constructor() {
    //
    const json =
      typeof window === "undefined"
        ? assetsJSON
        : (window as any).$engineAssets || assetsJSON;

    this._setJSON(json);
  }

  private _setJSON(json: typeof assetsJSON) {
    //
    Object.assign(this, json);
  }

  getImageOpt<S extends Scope>(scope: S, obj: ImageOpts): ImageOpts {
    //
    return (this as any)[scope]?.[obj?.id] || obj;
  }
}

export const Assets: Readonly<AssetsManager & typeof assetsJSON> =
  new AssetsManager() as any;
