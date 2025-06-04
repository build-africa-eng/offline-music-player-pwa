import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

function Equalizer({ audioRef, onClose }) {
  const [presets, setPresets] = useState({
    flat: [0, 0, 0, 0, 0], // 5 bands: 60Hz, 230Hz, 910Hz, 3kHz, 14kHz
    bassBoost: [6, 4, 0, -2, -4],
    trebleBoost: [-4, -2, 0, 4, 6],
  });
  const [currentPreset, setCurrentPreset] = useState('flat');
  const [frequencies, setFrequencies] = useState(presets.flat);

  const audioContextRef = useState(null);
  const filtersRef = useState([]);

  useEffect(() => {
    if (!audioRef.current) return;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef.current = audioContext;

    const source = audioContext.createMediaElementSource(audioRef.current._howl._sounds[0]._node);
    const filters = frequencies.map((gain, index) => {
      const filter = audioContext.createBiquadFilter();
      filter.type = 'peaking';
      filter.frequency.value = [60, 230, 910, 3000, 14000][index]; // Frequency bands
      filter.Q.value = 1;
      filter.gain.value = gain;
      return filter;
    });

    filtersRef.current = filters;

    // Chain filters: source -> filter1 -> filter2 -> ... -> destination
    source.connect(filters[0]);
    filters.reduce((prev, curr) => {
      prev.connect(curr);
      return curr;
    });
    filters[filters.length - 1].connect(audioContext.destination);

    return () => {
      filters.forEach((filter) => filter.disconnect());
      source.disconnect();
      audioContext.close();
    };
  }, [audioRef]);

  useEffect(() => {
    if (filtersRef.current.length) {
      filtersRef.current.forEach((filter, index) => {
        filter.gain.value = frequencies[index];
      });
    }
  }, [frequencies]);

  const handlePresetChange = (preset) => {
    setCurrentPreset(preset);
    setFrequencies(presets[preset]);
  };

  const handleFrequencyChange = (index, value) => {
    const newFrequencies = [...frequencies];
    newFrequencies[index] = parseInt(value);
    setFrequencies(newFrequencies);
    setCurrentPreset('custom');
  };

  return (
    <div className="relative flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-foreground">Equalizer</h3>
        <button
          onClick={onClose}
          className="p-2 rounded-full text-muted-foreground hover:text-primary transition-all"
          aria-label="Close equalizer"
        >
          <X size={20} />
        </button>
      </div>
      <div className="flex gap-2">
        {Object.keys(presets).map((preset) => (
          <button
            key={preset}
            onClick={() => handlePresetChange(preset)}
            className={`px-3 py-1 rounded-full text-sm capitalize ${
              currentPreset === preset
                ? 'bg-primary text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-muted-foreground'
            }`}
          >
            {preset}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-4">
        {frequencies.map((gain, index) => (
          <div key={index} className="flex flex-col items-center gap-1">
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={gain}
              onChange={(e) => handleFrequencyChange(index, e.target.value)}
              className="w-16 h-2 rounded-full appearance-none bg-gray-300 dark:bg-gray-700 accent-primary"
              orient="vertical"
            />
            <span className="text-xs text-muted-foreground">
              {['60Hz', '230Hz', '910Hz', '3kHz', '14kHz'][index]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Equalizer;