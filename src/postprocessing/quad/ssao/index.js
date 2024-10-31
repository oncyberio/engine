import {
    WebGLRenderTarget,
    Scene,
    Mesh,
    BufferGeometry,
    BufferAttribute,
    FloatType,
    RepeatWrapping,
    DataTexture,
    RGFormat,
    NearestFilter,
} from "three";

let geometry = null;

import Textures from "engine/textures";

function getFullscreenTriangle() {
    if (geometry === null) {
        const vertices = new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]);
        const uvs = new Float32Array([0, 0, 2, 0, 0, 2]);
        geometry = new BufferGeometry();

        // Added for backward compatibility (setAttribute was added in three r110).
        if (geometry.setAttribute !== undefined) {
            geometry.setAttribute("position", new BufferAttribute(vertices, 3));
            geometry.setAttribute("uv", new BufferAttribute(uvs, 2));
        } else {
            geometry.addAttribute("position", new BufferAttribute(vertices, 3));
            geometry.addAttribute("uv", new BufferAttribute(uvs, 2));
        }
    }

    return geometry;
}

import Renderer from "engine/renderer";

import { FBO_DEBUG } from "engine/constants";

import FBOHelper from "engine/globals/fbohelper";

import Material from "./material.js";

import Camera from "engine/camera";

let params = {
    radius: 3,
};

export default class SSAOKernel {
    constructor() {
        this.scene = new Scene();

        // this.camera = new Camera()

        this.output = new WebGLRenderTarget(1, 1, {
            type: FloatType,
            depthBuffer: false,
        });

        this.output.texture.name = "SSAOTexture";

        this.screen = new Mesh(getFullscreenTriangle(), new Material());

        this.screen.frustumCulled = false;

        this.scene.add(this.screen);

        this.radius = params.radius;

        if (FBO_DEBUG) {
            FBOHelper.attach(this.output, "ssao");
        }

        var Qd = [
            [0.478712, 0.875764],
            [-0.337956, -0.793959],
            [-0.955259, -0.028164],
            [0.864527, 0.325689],
            [0.209342, -0.395657],
            [-0.106779, 0.672585],
            [0.156213, 0.235113],
            [-0.413644, -0.082856],
            [-0.415667, 0.323909],
            [0.141896, -0.93998],
            [0.954932, -0.182516],
            [-0.766184, 0.410799],
            [-0.434912, -0.458845],
            [0.415242, -0.078724],
            [0.728335, -0.491777],
            [-0.058086, -0.066401],
            [0.20299, 0.686837],
            [-0.808362, -0.556402],
            [0.507386, -0.640839],
            [-0.723494, -0.22924],
            [0.48974, 0.317826],
            [-0.622663, 0.765301],
            [-0.01064, 0.929347],
            [0.663146, 0.647618],
            [-0.096674, -0.413835],
            [0.525945, -0.321063],
            [-0.122533, 0.366019],
            [0.195235, -0.687983],
            [-0.563203, 0.098748],
            [0.418563, 0.561335],
            [-0.378595, 0.800367],
            [0.826922, 0.001024],
            [-0.085372, -0.766651],
            [-0.92192, 0.183673],
            [-0.590008, -0.721799],
            [0.167751, -0.164393],
            [0.032961, -0.56253],
            [0.6329, -0.107059],
            [-0.46408, 0.569669],
            [-0.173676, -0.958758],
            [-0.242648, -0.234303],
            [-0.275362, 0.157163],
            [0.382295, -0.795131],
            [0.562955, 0.115562],
            [0.190586, 0.470121],
            [0.770764, -0.297576],
            [0.237281, 0.93105],
            [-0.666642, -0.455871],
            [-0.905649, -0.298379],
            [0.33952, 0.157829],
            [0.701438, -0.7041],
            [-0.062758, 0.160346],
            [-0.220674, 0.957141],
            [0.642692, 0.432706],
            [-0.77339, -0.015272],
            [-0.671467, 0.24688],
            [0.158051, 0.062859],
            [0.806009, 0.527232],
            [-0.05762, -0.247071],
            [0.333436, -0.51671],
            [-0.550658, -0.315773],
            [-0.652078, 0.589846],
            [0.008818, 0.530556],
            [-0.210004, 0.519896],
        ];

        let o = new Float32Array(Qd.length * 2);
        for (let l = 0; l < Qd.length; l++) {
            let u = l * 2;
            (o[u + 0] = Qd[l][0]), (o[u + 1] = Qd[l][1]);
        }

        this.blueNoiseInDiskTexture = new DataTexture(
            o,
            Qd.length,
            1,
            RGFormat,
            FloatType,
        );

        this.blueNoiseInDiskTexture.wrapS = RepeatWrapping;

        this.blueNoiseInDiskTexture.wrapT = RepeatWrapping;

        this.blueNoiseInDiskTexture.needsUpdate = true;

        console.log(this.blueNoiseInDiskTexture);

        this.blueNoiseTexture = Textures["blue_noise"];

        // console.log(Textures)

        // debugger;

        this.blueNoiseTexture.wrapS = RepeatWrapping;

        this.blueNoiseTexture.wrapT = RepeatWrapping;

        this.blueNoiseTexture.minFilter = NearestFilter;

        this.blueNoiseTexture.magFilter = NearestFilter;

        this.blueNoiseTexture.needsUpdate = true;

        // globalThis.ssao = this;
    }

    render(source, opts) {
        Renderer.setRenderTarget(this.output);

        // debugger;

        this.screen.material.uniforms.texture_depth.value = source;

        this.screen.material.uniforms.near.value = Camera.current.near;

        this.screen.material.uniforms.far.value = Camera.current.far;

        this.screen.material.uniforms.radius_of_influence.value = this.radius;

        let o = Camera.current.projectionMatrix.elements,
            a = 2 / o[0],
            l = 2 / o[5],
            u = -(1 - o[8]) / o[0],
            c = -(1 + o[9]) / o[5];

        this.screen.material.uniforms.proj_info.value.set(a, l, u, c);

        // console.log(Camera.current.fov)

        let h = Camera.current.fov * (Math.PI / 180),
            m =
                this.screen.material.uniforms.resolution.value.y /
                (Math.tan(h * 0.5) * 2),
            p =
                this.screen.material.uniforms.radius_of_influence.value *
                0.5 *
                m;

        // console.log( p )

        this.screen.material.uniforms.radius_in_screen_space.value = p;

        this.screen.material.uniforms.frame_index.value++;

        this.screen.material.uniforms.texture_blue_noise_in_disk.value =
            this.blueNoiseInDiskTexture;

        this.screen.material.uniforms.texture_blue_noise.value =
            this.blueNoiseTexture;

        // this.screen.material.uniforms.projectionMatrixInverse.value 		= Camera.current.projectionMatrixInverse

        // this.screen.material.uniforms.cameraMatrixWorld.value 		= Camera.current.matrixWorld

        // : { value: null },
        // this._camera.

        // this._camera.projectionMatrixInverse

        Renderer.render(this.scene, Camera.current);
    }

    setSize(width, height, dpi) {
        this.output.setSize(width, height);

        this.screen.material.uniforms.resolution.value.set(width, height);
    }
}
