import { PlaneGeometry, RingGeometry} from "three/src/Three.js";

import SimplexNoise from "simplex-noise";

import Smoothstep from "engine/utils/math/smoothstep";

const eps = 0.000001;

function distance(x1, y1, x2, y2) {
    var a = x1 - x2;
    var b = y1 - y2;

    return Math.sqrt(a * a + b * b);
}

function diagonalOfSquare(sideLength) {
    const diagonal = sideLength * Math.sqrt(2);
    return diagonal;
}



export function generateTerrainGeometry(data) {

    var geometry;

    if( data.shape == 'plane' ){

        geometry = new PlaneGeometry(
            1,
            1,
            data.definition,
            data.definition,
        );

        
    }

    else if( data.shape == 'circle'){

        geometry = new RingGeometry(data.innerRadius, 0.5, data.definition, data.definition);
    }

    geometry.rotateX(-Math.PI * 0.5);

    var simplex = new SimplexNoise(data.seed);

    let pos = geometry.attributes.position.array;

    let i = 0;

    // smoothCenter

    const maxSmooth = diagonalOfSquare(1) * 0.5;


    while (i < pos.length / 3) {
        const originalX = pos[i * 3];
        const originalZ = pos[i * 3 + 2];

        const dist = distance(originalX, originalZ, 0, 0);


        var smoothForce = Smoothstep(
            data.smoothCenter * maxSmooth - data.smoothLength,
            maxSmooth + data.smoothLength,
            dist,
        );

       // dist = 0.6

       // island smooth 0.5 

       var islandSmooth = 1

       if( dist > data.islandSmooth ){

            islandSmooth = 1.0 - Smoothstep(
                data.islandSmooth,
                data.islandSmooth + data.islandLength,
                dist,
            )
       }


        const x = originalX * data.noiseDomain;
        const z = originalZ * data.noiseDomain;

        if (data.scale.x < data.scale.z) {
            const ratio = data.scale.x / data.scale.z;

            pos[i * 3 + 1] = simplex.noise3D(x * ratio, 0, z);
        } else {
            const ratio = data.scale.z / data.scale.x;

            pos[i * 3 + 1] = simplex.noise3D(x, 0, z * ratio) + 1;
        }


        pos[i * 3 + 0] *= data.scale.x;
        pos[i * 3 + 1] *= smoothForce * data.scale.y;
        pos[i * 3 + 2] *= data.scale.z;

        pos[i * 3 + 1] *= islandSmooth;
        i++;
    }

    geometry.computeVertexNormals();

    return geometry;
}