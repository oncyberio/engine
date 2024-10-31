import Clamp from "engine/utils/math/clamp";

import { extToMime, isUploadable } from "./mimeutils";

let WRES_RE = /w_\d+/;

let HRES_RE = /h_\d+/;

let WHRES_RE = /(?:w_\d+,h_\d+)|(?:h_\d+,w_\d+)/;

let MAX_RES = 4096;
let MIN_RES = 0;

const REDIRECT_RE =
  /http(?:s)?:\/\/res\.cloudinary\.com\/(oncyber-io|oncybertesting)\/(.*)\/upload.*\/v/;

/*
cf https://cloudinary.com/documentation/upload_images#public_id

    Public ID values cannot begin or end with a space or forward slash (/).
    Additionally, they cannot include the following characters: ? & # \ % < > +

*/

const INVALID_PUBLIC_ID_CHARS = /[?&#\\\/%<>+]/g;

export const cloudinary = {
  //
  isCloudinaryUrl(url: string) {
    return (
      url?.startsWith("https://res.cloudinary.com/") ||
      url?.startsWith("http://res.cloudinary.com/")
    );
  },

  sanitizePublicID(id: string) {
    return id.trim().replace(INVALID_PUBLIC_ID_CHARS, "");
  },

  res(url: string, size: number, size2 = size) {
    if (!cloudinary.isCloudinaryUrl(url)) return url;

    size = Clamp(MIN_RES, MAX_RES, Math.floor(size));

    if (WHRES_RE.test(url)) {
      return url.replace(WRES_RE, `w_${size}`).replace(HRES_RE, `h_${size2}`);
    } else {
      return url.replace(
        "/upload/",
        `/upload/c_limit,fl_keep_dar,h_${size},w_${size2}/`
      );
    }
  },

  asImage(url: string) {
    if (!cloudinary.isCloudinaryUrl(url)) return url;

    let idx = url.lastIndexOf(".");

    if (idx > 0) {
      var ext = url.slice(idx);

      if (ext == ".mp4" || ext == ".webm") {
        ext = ".jpg";
      }

      return url.slice(0, idx) + ext;
    }

    return url;
  },

  toExt(url: string, ext: keyof typeof extToMime) {
    //
    if (!cloudinary.isCloudinaryUrl(url)) return url;

    let idx = url.lastIndexOf(".");

    if (idx > 0) {
      return url.slice(0, idx) + "." + ext;
    }

    return url;
  },

  lod(url: string, res = 300) {
    if (!cloudinary.isCloudinaryUrl(url)) return url;

    url = cloudinary.asImage(url);
    url = cloudinary.res(url, res);

    return url;
  },

  noTransform(url) {
    return url.replace(
      REDIRECT_RE,
      "https://res.cloudinary.com/$1/$2/upload/v"
    );
  },

  toWebmVideo(url: string) {
    if (!cloudinary.isCloudinaryUrl(url) || !url.endsWith(".mp4")) {
      return url;
    }

    return url.slice(0, url.length - 3) + "webm";
  },

  async redirect(url) {
    if (!cloudinary.isCloudinaryUrl(url)) {
      return url;
    }

    const response = await fetch(url, {
      method: "HEAD",
      mode: "cors",
    });

    if (response.ok) {
      return url;
    } else {
      return cloudinary.noTransform(url);
    }
  },
};

const POLAR_SAMA = "https://polar-mountain-96590.herokuapp.com/";

export const relay = {
  //
  isProxy(url: string) {
    return url?.startsWith(POLAR_SAMA);
  },

  proxyUrl(url: string) {
    return POLAR_SAMA + url;
  },
};

export async function fetchUrl(url: string, options?: RequestInit) {
  //
  let res = await fetch(url, options);

  if (res.status === 403 && !relay.isProxy(url)) {
    //
    res = await fetch(relay.proxyUrl(url), options);
  }

  return res;
}
