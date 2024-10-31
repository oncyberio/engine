import mainFrag from './shaders/main.frag.glsl'
import preFrag from './shaders/pre.frag.glsl'
import preVert from './shaders/pre.vert.glsl'
import suffVert from './shaders/suff.vert.glsl'


export default class FadeAndFakeLightPlugin {

    static get name(){

        return 'FadeAndFakeLight'
    }

    constructor(){

        this.name = 'FadeAndFakeLight'

        this.vertexShaderHooks = {

            prefix : preVert,
            suffix : suffVert
        }

        this.fragmentShaderHooks = {

            prefix    : preFrag,
            main   : mainFrag
        } 

        this.defines = {

            USE_NORMAL : ''
        }
    }
}