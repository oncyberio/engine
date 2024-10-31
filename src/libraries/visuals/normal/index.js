// import mainFrag from './shaders/main.frag.glsl'
// import preFrag from './shaders/pre.frag.glsl'
// import preVert from './shaders/pre.vert.glsl'
// import suffVert from './shaders/suff.vert.glsl'


import SuffFrag from './shaders/suff.frag.glsl'

export default class NormalPlugin {

    static get name(){

        return 'Normal'
    }

    constructor(){

        this.name = 'Normal'

        this.vertexShaderHooks = {

     
        }

        this.fragmentShaderHooks = {

            suffix: SuffFrag
        } 
    }
}