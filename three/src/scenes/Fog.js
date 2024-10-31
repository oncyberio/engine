import { Color } from '../math/Color.js';

class Fog {

	constructor( color, near = 1, far = 1000, texture = null, fadeColor ) {

		this.isFog = true;

		this.name = '';

		this.color = new Color( color );

		this.fadeColor = new Color( fadeColor );

		this.near = near;
		this.far = far;

		this.fogTexture = texture;

	}


	
	clone() {

		return new Fog( this.color, this.near, this.far, this.fogTexture, this.fadeColor );

	}

	toJSON( /* meta */ ) {

		return {
			type: 'Fog',
			name: this.name,
			color: this.color.getHex(),
			near: this.near,
			far: this.far,
			fogTexture: this.fogTexture,
			fadeColor: this.fadeColor.gethex()
		};

	}

}

export { Fog };
