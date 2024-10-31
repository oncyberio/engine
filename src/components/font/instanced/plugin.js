const FontPlugin = {
  attributes: {
    font_uv: {
      name: "font_uv",
      array: [],
      length: 4,
      defaultValue: [0, 0, 0, 0],
    },

    char_offset: {
      name: "char_offset",
      array: [],
      length: 3,
      defaultValue: [0, 0, 0],
    },

    char_scale: {
      name: "char_scale",
      array: [],
      length: 3,
      defaultValue: [1, 1, 1],
    },
  },
};

export default FontPlugin;
