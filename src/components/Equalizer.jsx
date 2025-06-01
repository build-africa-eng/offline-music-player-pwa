import { useEffect, useRef, useState } from 'react';
import { applyEqualizer } from '../lib/audio';

function Equalizer({ audioRef }) {
  const [bass, setBass] = useState(() => localStorage.getItem('eqBass') || 0);
  const [treble, setTreble] = useState(() => localStorage.getItem('eqTreble') || 0);

  useEffect(() => {
    if (audioRef.current) {
      applyEqualizer(audioRef.current, { bass: parseFloat(bass), treble: parseFloat(treble) });
      localStorage.setItem('eqBass', bass);
      localStorage.setItem('eqTreble', treble);
    }
  }, [bass, treble, audioRef]);

  return (
    <div className="absolute bottom-12 right-0 w-48 bg-background dark:bg-background-dark shadow-lg rounded-lg p-4 z-50">
      <div className="mb-2">
        <label className="text-xs">Bass</label>
        <input
          type="range"
          min="-6"
          max="6"
          step="0.1"
          value={bass}
          onChange={(e) => setBass(e.target.value)}
          className="w-full h-1 accent-primary"
        />
      </div>
      <div>
        <label className="text-xs">Treble</label>
        <input
          type="range"
          min="-6"
          max="6"
          step="0.1"
          value={treble}
          onChange={(e) => setTreble(e.target.value)}
          className="w-full h-1 accent-primary"
        />
      </div>
    </div>
  );
}

export default Equalizer;