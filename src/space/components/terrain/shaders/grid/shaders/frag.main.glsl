float x,y;
x=fract(vvUv.x * div);
y=fract(vvUv.y * div);

vec2 coord = vec2(x, y);

// Compute anti-aliased world-space grid lines
vec2 grid = (abs(fract(coord - 0.5) - 0.5)) / fwidth(coord) * 0.5;
float line = min(1.0, max( 0.0, min(grid.x, grid.y) ));

vec3 diffuse = vec3( ((1.0 - vec3(line)) * diffuse) );
 