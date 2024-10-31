const Random = function random(min, max) {
  return Math.random() * (max - min) + min;
};

const RandomFloor = function random(min, max) {
  return Math.floor(Random(min, max));
};

const RandomCeil = function random(min, max) {
  return Math.ceil(Random(min, max));
};
const RandomRound = function round(min, max) {
  return Math.round(Random(min, max));
};

const randoms = {
  Random,
  RandomFloor,
  RandomCeil,
  RandomRound,
};

export default randoms;
