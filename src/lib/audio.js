// Mock lyrics data
const mockLyrics = {
  'song1': `[00:00.00]Verse 1\n[00:15.00]This is a sample song...\n[00:30.00]Chorus\n[00:45.00]La la la...`,
  'song2': `[00:00.00]Intro\n[00:10.00]Welcome to the beat...\n[00:20.00]Verse 1\n[00:30.00]Keep it moving...`,
};

export async function getLyrics(songId, title, artist) {
  await new Promise(resolve => setTimeout(resolve, 500));
  const key = songId?.toLowerCase()?.trim();
  return mockLyrics[key] || `${title} by ${artist}\nNo lyrics available.`;
}

export function applyEqualizer(audioElement, { bass, treble }) {
  if (!audioElement) return () => {};

  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (sourceNode) sourceNode.disconnect();
  if (bassFilter) bassFilter.disconnect();
  if (trebleFilter) trebleFilter.disconnect();

  sourceNode = audioCtx.createMediaElementSource(audioElement);
  bassFilter = audioCtx.createBiquadFilter();
  trebleFilter = audioCtx.createBiquadFilter();

  bassFilter.type = 'lowshelf';
  bassFilter.frequency.setValueAtTime(200, audioCtx.currentTime);
  bassFilter.gain.setValueAtTime(bass, audioCtx.currentTime);

  trebleFilter.type = 'highshelf';
  trebleFilter.frequency.setValueAtTime(4000, audioCtx.currentTime);
  trebleFilter.gain.setValueAtTime(treble, audioCtx.currentTime);

  sourceNode.connect(bassFilter);
  bassFilter.connect(trebleFilter);
  trebleFilter.connect(audioCtx.destination);

  return () => {
    sourceNode?.disconnect();
    bassFilter?.disconnect();
    trebleFilter?.disconnect();
  };
}

export async function applyCrossfade(currentAudio, nextAudio, selectSongCallback, duration = 1000) {
  if (!currentAudio || !nextAudio) return;

  const fadeOut = (audio, duration) => {
    const startVolume = audio.volume;
    const startTime = performance.now();
    return new Promise(resolve => {
      const animate = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        audio.volume = startVolume * (1 - progress);
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          audio.pause();
          audio.volume = startVolume;
          resolve();
        }
      };
      animate();
    });
  };

  const fadeIn = (audio, duration) => {
    audio.volume = 0;
    audio.play();
    const startTime = performance.now();
    return new Promise(resolve => {
      const animate = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        audio.volume = progress;
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      animate();
    });
  };

  await Promise.all([fadeOut(currentAudio, duration), fadeIn(nextAudio, duration)]);
  selectSongCallback?.();
}