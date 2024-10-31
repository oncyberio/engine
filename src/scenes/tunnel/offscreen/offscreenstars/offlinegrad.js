

import {

    Scene ,

    Mesh,

    ShaderMaterial,

    WebGLRenderTarget,

    PerspectiveCamera,

    Float32BufferAttribute,

    BufferGeometry

} from 'three/src/Three.js'

import Vert   from './shadersgrad/vert.glsl'

import Frag from './shadersgrad/frag.glsl'



export default class Grad extends WebGLRenderTarget {

    constructor( renderer ){


        super( 1024, 4 )

        this.generateMipmaps = false

        var dummycam = new PerspectiveCamera()
        dummycam.near = 0


        var sc = new Scene()

        var t = new BufferGeometry()
        t.setIndex( [2, 1, 0] )
        t.setAttribute( 'position',  new Float32BufferAttribute( 
            [
            -1, -1, 0, 
            -1,  4, 0, 
            4, -1, 0
            ]
        , 3 ));


        var mesh = new Mesh(

            t,

            new ShaderMaterial({


                vertexShader: Vert,
                fragmentShader: Frag
            })


        )

        sc.add(mesh)

        renderer.setRenderTarget(this)

        renderer.render( sc, dummycam )

        renderer.setRenderTarget(null)
    }
}