#if defined(USE_MAP) && ( defined(UV_SHIFT_X) || defined(UV_SHIFT_Y) )
    vMapUv = uvShift( vMapUv );
#endif