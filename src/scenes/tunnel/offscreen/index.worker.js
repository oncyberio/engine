import OffscreenStars from './offscreenstars/index.js';

self.onmessage = function ( message ) {

	const data = message.data;

	switch( data.type ) {

		case 'init': 

			self.offscreenStars = new OffscreenStars( self, data, function(){

				self.postMessage({type: 'init'})
			} )

		break;

		case 'play': 

			self.offscreenStars.play()

		break;

		case 'activate':

			self.offscreenStars.activate()

		break

		case 'desactivate' : 

			self.offscreenStars.desactivate( function(){

				self.postMessage({type: 'desactivate'})
			} )

		break;

		case 'stop': 

			self.offscreenStars.stop()
		break;

		case 'resize': 

			self.lastResize = data.size

			if( self.offscreenStars ) {

				self.offscreenStars.resize(self.lastResize)

			}

		break;
	}
};