#ifdef UV_SHIFT 

    uniform vec2 uvShiftDirection;

    uniform float timer;

    vec2 uvShift(  vec2 inuv ){

        vec2 res = inuv;

        res.x = mod( res.x + uvShiftDirection.x * timer , 1.0);

        res.y = mod( res.y + uvShiftDirection.y * timer , 1.0);

        return res;
    }

#endif