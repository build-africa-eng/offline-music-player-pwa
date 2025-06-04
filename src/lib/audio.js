let audioCtx = null;
let sourceNode, bassFilter, trebleFilter;

// Mock lyrics data
const mockLyrics = {
  'song1': `[00:00.00]Verse 1\n[00:15.00]This is a sample song...\n[00:30.00]Chorus\n[00:45.00]La la la...`,
  'song2': `[00:00.00]Intro\n[00:10.00]Welcome to the beat...\n[00:20.00]Verse 1\n[00:30.00]Keep it moving...`,
};

// Fetch and parse lyrics
export async function getLyrics(songId, title, artist) {
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
  const key = songId?.toLowerCase()?.trim();
  const raw = mockLyrics[key];
  if (!raw) return `${title} by ${artist}\nNo lyrics available.`;

  return parseLyrics(raw);
}

// Convert "[00:15.00]Line" → { time: seconds, text: string }
function parseLyrics(rawLyrics) {
  return rawLyrics.split('\n').map(line => {
    const match = line.match(/(\d+):(\d+\.\d+)(.*)/); // fixed regex
    if (!match) return null;
    const [, min, sec, text] = match;
    const time = parseInt(min, 10) * 60 + parseFloat(sec);
    return { time, text: text.trim() };
  }).filter(Boolean);
}

// Equalizer setup
export function applyEqualizer(audioElement, { bass = 0, treble = 0 }) {
  if (!audioElement) return () => {};

  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  try {
    sourceNode?.disconnect();
    bassFilter?.disconnect();
    trebleFilter?.disconnect();
  } catch (e) {}

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

  audioElement._sourceNode = sourceNode;

  return () => {
    try {
      sourceNode?.disconnect();
      bassFilter?.disconnect();
      trebleFilter?.disconnect();
    } catch (e) {}
  };
}

// Crossfade between two audio elements
/**
 * Crossfades between two audio elements smoothly.
 * @param {HTMLAudioElement} fromAudio - Audio to fade out.
 * @param {HTMLAudioElement} toAudio - Audio to fade in.
 * @param {Function} callback - Called after crossfade.
 * @param {number} duration - Duration of crossfade in ms.
 */
export async function applyCrossfade(fromAudio, toAudio, callback, duration = 1000) {
  if (!fromAudio || !toAudio) return;

  const fade = (audio, fromVolume, toVolume, duration) => {
    const startTime = performance.now();
    return new Promise(resolve => {
      const animate = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        audio.volume = fromVolume + (toVolume - fromVolume) * progress;
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          audio.volume = toVolume;
          resolve();
        }
      };
      animate();
    });
  };

  try {
    await toAudio.play();
  } catch (err) {
    console.warn("Next audio playback failed:", err);
  }

  toAudio.volume = 0;
  await Promise.all([
    fade(fromAudio, 1, 0, duration),
    fade(toAudio, 0, 1, duration)
  ]);

  fromAudio.pause();
  callback?.();
}

// Optional EQ Presets
/*
export const EQ_PRESETS = {
  Flat: { bass: 0, treble: 0 },
  BassBoost: { bass: 10, treble: 0 },
  TrebleBoost: { bass: 0, treble: 10 },
  Rock: { bass: 6, treble: 6 },
  Vocal: { bass: -2, treble: 4 },
};
*/