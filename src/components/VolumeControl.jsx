import { Volume2, VolumeX } from 'lucide-react';

function VolumeControl({ volume, setVolume, isMuted, setIsMuted }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setIsMuted(!isMuted)}
        className="p-2 rounded-full text-muted-foreground hover:text-primary transition-all"
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={isMuted ? 0 : volume}
        onChange={(e) => {
          setVolume(parseFloat(e.target.value));
          setIsMuted(false);
        }}
        className="w-24 h-2 rounded-full appearance-none bg-gray-300 dark:bg-gray-700 accent-primary"
      />
    </div>
  );
}

export default VolumeControl;