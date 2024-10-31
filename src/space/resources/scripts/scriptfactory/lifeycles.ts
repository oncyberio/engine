//
export const gameLifecycles = {
    onPreload: null,
    onLoad: null,
    onReady: null,
    onStart: null,
    onEnd: null,
    onDawnUpdate: null,
    onUpdate: null,
    onDispose: null,
    onPause: null,
    onResume: null,
};

const spaceLifecycles = {
    onRenderInit: null,
    onRenderUpdate: null,
    onRenderDispose: null,
};

export function hasGameLifecycle(obj: object) {
    //
    if (obj == null) return false;

    for (let key in gameLifecycles) {
        if (obj[key]) {
            return true;
        }
    }

    return false;
}

export function hasSpaceLifecycle(obj: object) {
    //
    if (obj == null) return false;

    for (let key in spaceLifecycles) {
        if (obj[key]) {
            return true;
        }
    }

    return false;
}
