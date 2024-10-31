var GetAdditionalMetas = function (metaDataArray) {

    const arr = metaDataArray.image.source.data.data;

    var str = ``;

    str += `vec4 ADDITIONAL_META_DATA_ARRAY[` + arr.length / 4 + `];\n`;
    let i = 0;

    let g = 0;

    while (i < arr.length) {
        var a = arr[i];
        var b = arr[i + 1];
        var c = arr[i + 2];
        var d = arr[i + 3];

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
            `ADDITIONAL_META_DATA_ARRAY[` +
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

export default GetAdditionalMetas;
