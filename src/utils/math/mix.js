/**
 * Mix glsl in js
 *
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {number} value - value
 * @return {number}
 * @memberof Math
 * @example
 *
 *     Mix(0,1, 10)
 */

const Mix = function mix(min, max, value) {
  return min * (1 - value) + max * value;
};

export default Mix;
