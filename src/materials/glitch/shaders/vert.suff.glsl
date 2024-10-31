vec3 tempPosition  	=   (modelMatrix * vec4(transformed, 1.0)).xyz;

vPosUv 				= 	vec2( tempPosition.x + tempPosition.z, tempPosition.y );

vWorldPosition  	= 	distance( (modelMatrix * vec4(position, 1.0)).xz, cameraPosition.xz);


float midZ 			=  -(modelViewMatrix * vec4(0.0,0.0,0.0, 1.0)).z;


vScanSize 			= 	smoothstep( max_flat, max_flat - 0.001, midZ);

float mdlMidZ   	=    modelMatrix[3].z;

nShiftPower 		= 	mix( rgb_shift_power, 0.0, when_gt(0.95, rand( floor( mdlMidZ + timer * 10.0)) ));

vWorldPosition  = distance( (modelMatrix * vec4(position, 1.0)).xz, cameraPosition.xz);

vUv = uv;