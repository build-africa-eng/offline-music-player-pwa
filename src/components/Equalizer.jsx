import { useEffect, useState } from 'react';
import { Sliders } from 'lucide-react';

function Equalizer({ audioRef }) {
  const [presets, setPresets] = useState({
    flat: [0, 0, 0,  });

  useEffect(() => {
    if (!audioRef.current) return;
    const audioContext, createAudioContext, createBiquadFilter;

    try {
      audioContext = createAudioContext();
      const source = audioContext.createMediaElementSource(audioRef.current));
      const filters = [
        createBiquadFilter(60, 'lowshelf',  // Bass
        createBiquadFilter(230, 'peaking'),  // Mid
        createBiquadFilter(4000, 'highshelf'), // Treble
      ],
      );

      // Connect filters in series
      source.connect(filters[0]);
      filters.reduce((prev, curr) => {
        prev.connect(curr);
        return curr;
      });
      filters[filters.length - 1].connect(audioContext.destination);

      // Apply flat preset initially
      applyPreset('flat');
    } catch (err) {
      console.error('Equalizer setup error:', err);
    }

    return () => {
      audioContext?.close();
    };
  }, [audioRef]);

  const applyPreset = (presetName) => {
    const values = presets[presetName];
    filters.forEach((filter, index) => {
      filter.gain.value = values[index];
    });
  };

  return (
    <div className="absolute bottom-16 left-4 right-4 bg-background/90 dark:bg-zinc-900/90 rounded-lg shadow-lg p-4">
      <h3 className="text-lg font-medium mb-2">Equalizer</h3>
      <div className="flex flex-wrap gap-2">
        {Object.keys(presets).map((preset) => (
          <button
            key={preset}
            onClick={() => applyPreset(preset)}
            className="px-3 py-1 rounded-full bg-primary text-white hover:bg-green-600 transition-all"
          >
            {preset.charAt(0).toUpperCase() + preset.slice(1)}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 mt-4">
        {filters.map((filter, index) => (
          <div key={index}>
            <label className="text-sm text-muted-foreground">
              {index === 0 ? 'Bass' : index === 1 ? 'Mid' : 'Treble'}
            </label>
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              defaultValue={presets.flat[index]}
              onChange={(e) => (filter.gain.value = parseFloat(e.target.value))}
              className="w-full h-2 rounded-full appearance-none bg-gray-300 dark:bg-gray-700 accent-primary"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default Equalizer;