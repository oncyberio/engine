
import preVert from './shaders/pre.vert.glsl'
import suffVert from './shaders/suff.vert.glsl'

import preFrag from './shaders/pre.frag.glsl'

export default class InstanceOpacityPlugin {

    static get name(){

        return 'InstanceOpacityPlugin'
    }

    constructor(){

        this.name = 'InstanceOpacityPlugin'

        this.vertexShaderHooks = {

            prefix : preVert,
            suffix : suffVert
        }

        this.fragmentShaderHooks = {

            prefix : preFrag,
        }

        this.replacers = {

             // lambert 
            fragment : [
                {
                    source: "vec4 diffuseColor = vec4( diffuse, opacity );",
                    replace: "vec4 diffuseColor = vec4( diffuse, opacity * vOpacity );"
                }
            ]
        }
    }
}