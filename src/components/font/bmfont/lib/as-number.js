export default function numtype(num, def) {
  return typeof num === "number" ? num : typeof def === "number" ? def : 0;
}
