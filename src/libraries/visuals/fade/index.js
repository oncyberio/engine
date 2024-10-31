import mainFrag from './shaders/main.frag.glsl'
import preFrag from './shaders/pre.frag.glsl'
import preVert from './shaders/pre.vert.glsl'
import suffVert from './shaders/suff.vert.glsl'


export default class FadePlugin {

    static get name(){

        return 'Fade'
    }

    constructor(){

        this.name = 'Fade'

        this.vertexShaderHooks = {

            prefix : preVert,
            suffix : suffVert
        }

        this.fragmentShaderHooks = {

            prefix    : preFrag,
            main   : mainFrag
        } 
    }
}