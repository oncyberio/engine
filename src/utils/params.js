// @ts-check
const FRONT_END = typeof window !== "undefined";

let conf = {};

if (FRONT_END) {
  const params = new URLSearchParams(window.location.search);

  conf = {};

  params.forEach((value, key) => {
    conf[key] = value === "true" ? true : value === "false" ? false : value;
  });
}

export default conf;
