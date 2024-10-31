// @ts-check

import { Vector3 } from "three";

const scale = 1;

const size = new Vector3();

const center = new Vector3();

class StyleKit {
    /**
     *
     * @param {Record<string, any>} types
     * @returns {Record<string, any>}
     */
    get(types) {
        var res = {};

        let currentX = 0;

        let padd = 2.5;

        let uid = Date.now();

        for (const property in types) {
            // debugger;

            const data = {};

            data.id = `kitb-${++uid}`;

            data.type = property;

            const type = types[property].baseItems;

            let i = 0;

            var box = types[property].baseBox.clone();

            const xSize = Math.abs(box.max.x * scale - box.min.x * scale);

            currentX += xSize * 0.5 + padd;

            while (i < type.length) {
                data.position = { x: currentX, y: 0.001, z: -20 };

                data.rotation = { _x: 0, _y: 0, _z: 0 };

                i++;
            }

            currentX += xSize * 0.5;

            res[data.id] = data;
        }

        // center

        let mid = currentX * 0.5;

        let i = 0;

        for (let key in res) {
            res[key].position.x -= mid;
        }

        return res;
    }

    centerBox3(box) {
        box.getSize(size);
        box.getCenter(center);
        const offsetX = -center.x;
        const offsetZ = -center.z;
        box.min.add(new Vector3(offsetX, 0, offsetZ));
        box.max.add(new Vector3(offsetX, 0, offsetZ));

        return box;
    }
}

export default new StyleKit();
