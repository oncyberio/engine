import { QUALITY, QUALITIES } from "engine/constants";

const maxframeBufferSize4K = {
  x: 3500,
  y: 1800,
};

// either we lower resolution by 10%

export function resizer(windowWidth, windowHeight) {
  let maxX = 0;
  let maxY = 0;

  let multiplier = 1;

  if (QUALITY === QUALITIES.MEDIUM) {
    multiplier = 0.8;
  } else if (QUALITY === QUALITIES.LOW) {
    multiplier = 0.6;
  }

  maxX = windowWidth * multiplier;
  maxY = windowHeight * multiplier;

  if (maxX * maxY > maxframeBufferSize4K.x * maxframeBufferSize4K.y) {
    maxX = maxframeBufferSize4K.x;
    maxY = maxframeBufferSize4K.y;
  }

  const baseSize = Math.sqrt(maxX * maxY);

  const maxSize = baseSize * baseSize;

  let width = windowWidth;

  let height = windowHeight;

  if (windowWidth * windowHeight > maxSize) {
    const ratio = height / width;

    width = baseSize;

    height = Math.floor(baseSize * ratio);

    let newSize = width * height;

    const scalar = Math.sqrt(maxSize / newSize);

    width = Math.floor(width * scalar);

    height = Math.floor(height * scalar);
  }

  return {
    width,
    height,
  };
}
