const Smoothstep = function smoothstep(min, max, value) {
  if (min === max) {
    // If min and max are the same, return 0 if value is less than or equal to min,
    // and return 1 if value is greater than min.
    return value <= min ? 0 : 1;
  }

  return Math.max(0, Math.min(1, (value - min) / (max - min)));
};

export default Smoothstep;
