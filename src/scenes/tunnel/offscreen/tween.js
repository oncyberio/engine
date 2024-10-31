// sam tween library in webworker

// Tweening Function
export default function createTween(workerScope, targetObj, propertyName, tweenObj ) {
  let startTime = null;
  let isAnimating = false;

  function update() {
    if (!isAnimating) return;

    const currentTime = performance.now() / 1000
    const elapsedTime = currentTime - startTime;

    if (elapsedTime >= tweenObj.duration) {
      targetObj[propertyName] = tweenObj.to;
      tweenObj.update(tweenObj.to);
      if (typeof tweenObj.onComplete === 'function') {
        tweenObj.onComplete();
      }
      isAnimating = false;
      return;
    }

    const progress = elapsedTime / tweenObj.duration;
    const interpolatedValue = tweenObj.tweenFunction(progress);
    const newValue = tweenObj.from + (tweenObj.to - tweenObj.from) * interpolatedValue;
    targetObj[propertyName] = newValue;
    tweenObj.update(newValue);

    workerScope.requestAnimationFrame(update);
  }

  return {
    start: () => {
      if (!isAnimating) {
        isAnimating = true;
        startTime = performance.now() / 1000;

        update();
      }
    },
    stop: () => {
      isAnimating = false;
    }
  };
}


// this.tween = CreateTween(
//   this.workerScope,
//   this,
//   'customTransition',
//   {
//     from: this.transitionValue,
//     to: 1,
//     duration: 4.5,
//     tweenFunction: this.easeOut,
//     update: (newValue) => {
//       console.log('Updated value:', newValue);
//     },
//     onComplete: () => {
//       console.log('Tween completed!');
//     }
//   }
// )

// this.tween.start( this.clock.getElapsedTime() )