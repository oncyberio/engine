import PipeLineMesh from "engine/abstract/pipelinemesh";
import { disposeThreeResources } from "engine/utils/dispose";
import {
    Box3,
    CircleGeometry,
    Color,
    CylinderGeometry,
    DoubleSide,
    Group,
    MeshBasicMaterial,
    ShaderMaterial,
    Vector3,
} from "three";

const defSize = new Vector3(1, 3, 1);

export class SpawnSelectionMesh {
    static create(bbox: Box3) {
        // const shape = new Shape()
        // shape.moveTo( 0.5, -1 )
        // shape.lineTo( 0.5, 0 )
        // shape.lineTo( 1, 0 )
        // shape.lineTo( 0, 1 )
        // shape.lineTo( -1, 0 )
        // shape.lineTo( -0.5, 0 )
        // shape.lineTo( -0.5, -1 )
        // shape.lineTo( 0.5, -1 )

        // const geo = new ShapeGeometry(shape)
        // geo.scale(1.5, 2, 1)
        // geo.rotateX(-Math.PI / 2)

        // const dirMesh = new PipeLineMesh(
        //     geo,
        //     new MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4 }),
        // )

        const size = bbox.getSize(new Vector3());

        const height = size.y;

        const radius = Math.max(size.x, size.z) / 1.6;

        const baseY = bbox.min.y;

        const vertexShader = `
            varying vec2 vUv;

            void main() {
               vUv = uv;
               gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const occlusionMaterial = new MeshBasicMaterial({ color: 0x0000 });

        const baseGeo = new CircleGeometry(radius).rotateX(-Math.PI / 2);

        // translate baseGeo so that y local pos is same as bbox.min.y
        baseGeo.translate(0, baseY, 0);

        const base = new PipeLineMesh(
            baseGeo,
            new ShaderMaterial({
                transparent: true,

                side: DoubleSide,
                uniforms: {
                    vcolor1: { value: new Color("#99FF69") },
                    vcolor2: { value: new Color("#042E34") },
                },

                polygonOffset: true,

                polygonOffsetFactor: -2.0,

                polygonOffsetUnits: -8.0,
                vertexShader,
                fragmentShader: `

                  varying vec2 vUv;
                  uniform vec3 vcolor1;
                  uniform vec3 vcolor2;

                  vec4 radial_grad(vec4 c1, vec4 c2, float s, float t) {
                    vec4 color = mix(c1, c2, smoothstep(0., s, t));
                    color = mix(color, c2, smoothstep(s, 1., t));
                    return color;
                  }

                  void main() {

                    float dist = distance(vUv, vec2(0.5, 0.5));

                    float t = smoothstep(0.0, 1., dist);

                    vec4 c2 = vec4(vcolor2, 1.);
                    vec4 c1  = vec4(vcolor1, 1.);

                    vec4 color = radial_grad(c1, c2, 0.302083, t);

                    gl_FragColor = color;
                  }
                `,
            }),
            {
                occlusionMaterial,
                visibleOnMirror: false,
            }
        );

        // base.renderOrder = Infinity

        // base.translateY(-height / 2);

        const material = new ShaderMaterial({
            transparent: true,
            // side: DoubleSide,
            uniforms: {
                color: { value: new Color("#28D348") },
                height: { value: height },
            },
            vertexShader,
            fragmentShader: `
              uniform vec3 color;
              uniform float height;
              varying vec2 vUv;

              void main() {

                float opacity = 1. - smoothstep(0.0, 0.7, vUv.y);

                gl_FragColor = vec4(color, opacity);
              }
            `,
        });

        const haloGeo = new CylinderGeometry(
            radius,
            radius,
            height,
            32,
            1,
            true
        );

        // translate haloGeo so that y local pos is same as bbox.min.y
        haloGeo.translate(0, baseY + height / 2, 0);

        const mesh = new PipeLineMesh(haloGeo, material, {
            occlusionMaterial,
            visibleOnMirror: false,
        });

        mesh.renderOrder = 1_000_000;

        debugger;

        // mesh.translateY(1.5);

        // mesh.add(dirMesh)

        // dirMesh.position.y = 0.1

        const group = new Group();

        group.add(mesh);

        group.add(base);

        return group;
    }

    static dispose(mesh) {
        disposeThreeResources(mesh);

        for (let i = 0; i < mesh.children.length; i++) {
            disposeThreeResources(mesh.children[i]);
        }
    }
}
