export class AnimationLoop {
  //
  constructor() {
    this._isPlaying = false;
    this.listeners = [];
    this.delayedCalls = [];
    this.lastFrameTime = 0;

    // Bind methods to preserve context
    this.tick = this.tick.bind(this);
  }

  add(callback) {
    this.listeners.push(callback);
    if (!this._isPlaying) {
      this.play();
    }
  }

  remove(callback) {
    this.listeners = this.listeners.filter((listener) => listener !== callback);
    if (this.listeners.length === 0 && this._isPlaying) {
      this.pause();
    }
  }

  delayedCall(delay, callback) {
    //
    const endTime = performance.now() + delay * 1000;

    this.delayedCalls.push({
      callback,
      endTime,
    });

    return {
      kill: () => {
        const index = this.delayedCalls.findIndex(
          (call) => call.callback === callback
        );
        if (index !== -1) {
          this.delayedCalls.splice(index, 1);
        }
      },
    };
  }

  tick = (currentTime) => {
    //
    if (!this._isPlaying) return;

    const deltaTime = (currentTime - this.lastFrameTime) * 0.001;

    this.lastFrameTime = currentTime;

    for (let i = 0; i < this.listeners.length; i++) {
      this.listeners[i](deltaTime);
    }

    for (let i = 0; i < this.delayedCalls.length; i++) {
      const { callback, endTime } = this.delayedCalls[i];
      if (currentTime >= endTime) {
        callback();
        this.delayedCalls.splice(i, 1);
        i--;
      }
    }

    requestAnimationFrame(this.tick);
  };

  play() {
    if (this._isPlaying) {
      console.warn("Animation engine is already playing");
      return;
    }

    this._isPlaying = true;
    this.lastFrameTime = performance.now();
    requestAnimationFrame(this.tick);
  }

  pause() {
    this._isPlaying = false;
  }
}
