// Mock lyrics data
const mockLyrics = {
  'song1': `Verse 1\nThis is a sample song...\nChorus\nLa la la...`,
  'song2': `Intro\nWelcome to the beat...\nVerse 1\nKeep it moving...`,
};

// Mock lyrics fetch (placeholder for Musixmatch/Genius API)
export async function getLyrics(songId, title, artist) {
  await new Promise(resolve => setTimeout(resolve, 500));
  return { lyrics: mockLyrics[songId] || `${title} by ${artist}\nNo lyrics available.` };
}

// Equalizer
export function applyEqualizer(audioElement, { bass, treble }) {
  if (!audioElement) return;

  const context = new (window.AudioContext || window.webkitAudioContext)();
  const source = context.createMediaElementSource(audioElement);
  const bassFilter = context.createBiquadFilter();
  const trebleFilter = context.createBiquadFilter();

  bassFilter.type = 'lowshelf';
  bassFilter.frequency.setValueAtTime(200, context.currentTime);
  bassFilter.gain.setValueAtTime(bass, context.currentTime);

  trebleFilter.type = 'highshelf';
  trebleFilter.frequency.setValueAtTime(4000, context.currentTime);
  trebleFilter.gain.setValueAtTime(treble, context.currentTime);

  source.connect(bassFilter);
  bassFilter.connect(trebleFilter);
  trebleFilter.connect(context.destination);

  return () => context.close();
}

// Crossfade
export async function applyCrossfade(currentAudio, nextAudio, duration = 1000) {
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
}