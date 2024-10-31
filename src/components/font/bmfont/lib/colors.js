export function attribute(colorarray = [0, 0, 0], length) {
  if (colorarray[0] > 1) {
    colorarray[0] /= 255;
    colorarray[1] /= 255;
    colorarray[2] /= 255;
  }

  var colors = new Float32Array(length);
  var i = 0;
  var i3 = 0;
  while (i < length) {
    colors[i3] = colorarray[0];
    colors[i3 + 1] = colorarray[1];
    colors[i3 + 2] = colorarray[2];

    i++;
    i3 += 3;
  }
  return colors;
}
