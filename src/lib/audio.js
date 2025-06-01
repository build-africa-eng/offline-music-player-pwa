let audioCtx = null;
let sourceNode, bassFilter, trebleFilter;

// Mock lyrics data
const mockLyrics = {
  'song1': `[00:00.00]Verse 1\n[00:15.00]This is a sample song...\n[00:30.00]Chorus\n[00:45.00]La la la...`,
  'song2': `[00:00.00]Intro\n[00:10.00]Welcome to the beat...\n[00:20.00]Verse 1\n[00:30.00]Keep it moving...`,
};

// Fetch and parse lyrics
export async function getLyrics(songId, title, artist) {
  await new Promise(resolve => setTimeout(resolve, 500));
  const key = songId?.toLowerCase()?.trim();
  const raw = mockLyrics[key];
  if (!raw) return `${title} by ${artist}\nNo lyrics available.`;

  return parseLyrics(raw);
}

// Convert "[00:15.00]Line" → { time: seconds, text: string }
function parseLyrics(rawLyrics) {
  return rawLyrics.split('\n').map(line => {
    const match = line.match(/(\d+):(\d+\.\d+)(.*)/);
    if (!match) return null;
    const [, min, sec, text] = match;
    const time = parseInt(min, 10) * 60 + parseFloat(sec);
    return { time, text: text.trim() };
  }).filter(Boolean);
}

// Equalizer setup
export function applyEqualizer(audioElement, { bass = 0, treble = 0 }) {
  if (!audioElement) return () => {};

  // Initialize audio context
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  // Disconnect old nodes safely
  try {
    sourceNode?.disconnect();
    bassFilter?.disconnect();
    trebleFilter?.disconnect();
  } catch (e) {}

  // Create nodes
  sourceNode = audioCtx.createMediaElementSource(audioElement);
  bassFilter = audioCtx.createBiquadFilter();
  trebleFilter = audioCtx.createBiquadFilter();

  // Setup filters
  bassFilter.type = 'lowshelf';
  bassFilter.frequency.setValueAtTime(200, audioCtx.currentTime);
  bassFilter.gain.setValueAtTime(bass, audioCtx.currentTime);

  trebleFilter.type = 'highshelf';
  trebleFilter.frequency.setValueAtTime(4000, audioCtx.currentTime);
  trebleFilter.gain.setValueAtTime(treble, audioCtx.currentTime);

  // Connect graph
  sourceNode.connect(bassFilter);
  bassFilter.connect(trebleFilter);
  trebleFilter.connect(audioCtx.destination);

  // Optional: attach source node reference to avoid duplication
  audioElement._sourceNode = sourceNode;

  // Cleanup function
  return () => {
    try {
      sourceNode?.disconnect();
      bassFilter?.disconnect();
      trebleFilter?.disconnect();
    } catch (e) {}
  };
}

// Optional EQ Presets (uncomment to use)
/*
export const EQ_PRESETS = {
  Flat: { bass: 0, treble: 0 },
  BassBoost: { bass: 10, treble: 0 },
  TrebleBoost: { bass: 0, treble: 10 },
  Rock: { bass: 6, treble: 6 },
  Vocal: { bass: -2, treble: 4 },
};
*/

// Crossfade between two audio elements
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
          audio.volume = startVolume; // Reset for reuse
          resolve();
        }
      };
      animate();
    });
  };

  const fadeIn = async (audio, duration) => {
    audio.volume = 0;
    try {
      await audio.play();
    } catch (e) {
      console.warn("Playback failed:", e);
    }
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

  await fadeOut(currentAudio, duration);
  selectSongCallback?.(); // Ensure song selection logic fires now
  await fadeIn(nextAudio, duration);
}