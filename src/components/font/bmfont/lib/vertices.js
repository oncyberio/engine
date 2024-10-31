export function pages(glyphs) {
  var pages = new Float32Array(glyphs.length * 4 * 1);
  var i = 0;
  glyphs.forEach(function (glyph) {
    var id = glyph.data.page || 0;
    pages[i++] = id;
    pages[i++] = id;
    pages[i++] = id;
    pages[i++] = id;
  });
  return pages;
}

export function uvs(glyphs, texWidth, texHeight, flipY) {
  var uvs = new Float32Array(glyphs.length * 4 * 2);
  var i = 0;
  glyphs.forEach(function (glyph) {
    var bitmap = glyph.data;
    var bw = bitmap.x + bitmap.width;
    var bh = bitmap.y + bitmap.height;

    // top left position
    var u0 = bitmap.x / texWidth;
    var v1 = bitmap.y / texHeight;
    var u1 = bw / texWidth;
    var v0 = bh / texHeight;

    if (flipY) {
      v1 = (texHeight - bitmap.y) / texHeight;
      v0 = (texHeight - bh) / texHeight;
    }

    // BL
    uvs[i++] = u0;
    uvs[i++] = v1;
    // TL
    uvs[i++] = u0;
    uvs[i++] = v0;
    // TR
    uvs[i++] = u1;
    uvs[i++] = v0;
    // BR
    uvs[i++] = u1;
    uvs[i++] = v1;
  });
  return uvs;
}

export function separateuvs(glyphs, texWidth, texHeight, flipY) {
  var uvArray = [];
  var i = 0;
  glyphs.forEach(function (glyph) {
    var uvs = [];
    var bitmap = glyph.data;

    // BL
    uvs[0] = bitmap.x / texWidth;
    uvs[1] = bitmap.y / texHeight;
    // TL
    uvs[2] = bitmap.width / texWidth;
    uvs[3] = bitmap.height / texHeight;

    // uvs[i++] = u0;
    // uvs[i++] = v1;
    // // TL
    // uvs[i++] = u0;
    // uvs[i++] = v0;
    // // TR
    // uvs[i++] = u1;
    // uvs[i++] = v0;
    // // BR
    // uvs[i++] = u1;
    // uvs[i++] = v1;

    uvArray.push(uvs);
  });

  return uvArray;
}

export function positions(glyphs) {
  var positions = new Float32Array(glyphs.length * 4 * 2);
  var i = 0;
  glyphs.forEach(function (glyph) {
    var bitmap = glyph.data;

    // bottom left position
    var x = glyph.position[0] + bitmap.xoffset;
    var y = glyph.position[1] + bitmap.yoffset;

    // quad size
    var w = bitmap.width;
    var h = bitmap.height;

    // BL
    positions[i++] = x;
    positions[i++] = y;
    // TL
    positions[i++] = x;
    positions[i++] = y + h;
    // TR
    positions[i++] = x + w;
    positions[i++] = y + h;
    // BR
    positions[i++] = x + w;
    positions[i++] = y;
  });
  return positions;
}

export function sizes(glyphs, scale, align = "center", instanced = false) {
  var s = [];
  var i = 0;

  var minX = Infinity;
  var maxX = -Infinity;

  var minY = Infinity;
  var maxY = -Infinity;

  glyphs.forEach(function (glyph) {
    var bitmap = glyph.data;

    // bottom left position
    var x = glyph.position[0] + bitmap.xoffset;
    var y = glyph.position[1] + bitmap.yoffset;

    // quad size
    var w = bitmap.width;
    var h = bitmap.height;

    var res = {
      offset: {
        x: scale * ((x + x + w) * 0.5),
        y: -scale * ((y + y + h) * 0.5),
      },

      size: {
        x: scale * bitmap.width * 0.5,
        y: scale * bitmap.height * 0.5,
      },
    };

    minX = Math.min(minX, res.offset.x - res.size.x);
    maxX = Math.max(maxX, res.offset.x + res.size.x);

    minY = Math.min(minY, res.offset.y - res.size.y);
    maxY = Math.max(maxY, res.offset.y + res.size.y);

    s.push(res);
  });

  if (align == "center" || instanced == true) {
    let i = 0;

    while (i < s.length) {
      s[i].offset.x -= (maxX + minX) * 0.5;

      if (instanced == true) {
        s[i].offset.y -= (maxY + minY) * 0.5;
      }

      i++;
    }
  }

  if (align == "left") {
    // debugger;
    // let i = 0
    // while( i < s.length ){
    //     s[i].offset.x -= minX
    //     i++
    // }
  }

  return s;
}
