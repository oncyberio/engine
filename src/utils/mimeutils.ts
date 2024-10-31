export const extToMime = {
  jpg: "image/jpg",
  jpeg: "image/jpeg",
  png: "image/png",
  svg: "image/svg",
  gif: "image/gif",
  bmp: "image/bmp",
  webp: "image/webp",
  mov: "video/quicktime",
  mp4: "video/mp4",
  webm: "video/webm",
  avi: "video/avi",
  html: "text/html",
  htm: "text/html",
  glb: "model/gltf-binary",
  gltf: "model/gltf+json",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4v: "video/x-m4v",
};

export const mimetoExt = {
  "image/jpg": "jpg",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/svg": "svg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/bmp": "bmp",
  "video/quicktime": "mov",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/avi": "avi",
  "text/html": "html",
  "model/gltf-binary": "glb",
  "model/gltf+json": "gltf",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "video/x-m4v": "m4v",
};

// all mime types supported
export const supportedMimes = [
  "image/jpg",
  "image/jpeg",
  "image/png",
  "image/svg",
  "image/svg+xml",
  "image/gif",
  "image/bmp",
  "image/webp",
  "video/quicktime",
  "video/mp4",
  "video/avi",
  "text/html",
  "model/gltf-binary",
  "model/gltf+json",
  "audio/mpeg",
  "audio/wav",
  "video/x-m4v",
];

export function getMimeType(url = "") {
  //
  const dotIndex = url.lastIndexOf(".");

  if (dotIndex < 0) return null;

  const ext = url.slice(dotIndex + 1, url.length);

  return extToMime[ext.toLowerCase()] ?? null;
}

export function isUploadable(mime: string) {
  if (!mime) return false;

  return (
    mime.includes("image") ||
    mime.includes("video") ||
    mime.includes("audio") ||
    mime.includes("model/gltf-binary") ||
    mime.includes("model/gltf+json")
  );
}

export function withCover(mime: string) {
  return mime.startsWith("audio") || mime === "text/html";
}

export function isAnimationUrl(mime: string = "") {
  return !mime.startsWith("image/");
}
