// src/lib/audio.js
export async function applyCrossfade(fromHowl, toHowl, callback, duration = 1000) {
  if (!fromHowl || !toHowl) return;

  const fade = (howl, fromVolume, toVolume) => {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const step = (timestamp) => {
        const progress = Math.min((timestamp - startTime) / duration, 1);
        howl.volume(fromVolume + (toVolume - fromVolume) * progress);
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  };

  toHowl.volume(0);
  await toHowl.play();
  await Promise.all([
    fade(fromHowl, 1, 0),
    fade(toHowl, 0, 1),
  ]);

  fromHowl.stop();
  callback?.();
}