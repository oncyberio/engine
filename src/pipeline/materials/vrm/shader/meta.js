var getMeta = function (meta) {
    const metaDataArray = meta.image.source.data.data;

    var str = ``;

    str += `vec4 META_DATA_ARRAY[` + metaDataArray.length / 4 + `];\n`;
    let i = 0;

    let g = 0;

    while (i < metaDataArray.length) {
        var a = metaDataArray[i];
        var b = metaDataArray[i + 1];
        var c = metaDataArray[i + 2];
        var d = metaDataArray[i + 3];

        if (Number.isInteger(a)) {
            a += ".0";
        }
        if (Number.isInteger(b)) {
            b += ".0";
        }
        if (Number.isInteger(c)) {
            c += ".0";
        }
        if (Number.isInteger(d)) {
            d += ".0";
        }

        str +=
            `META_DATA_ARRAY[` +
            g +
            `] = vec4(` +
            a +
            `,` +
            b +
            `,` +
            c +
            `,` +
            d +
            `);\n`;
        str += ``;
        i += 4;

        g++;
    }

    return str;
};

export default getMeta;
