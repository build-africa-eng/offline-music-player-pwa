import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Sliders, List, Info } from 'lucide-react';
import classNames from 'classNames';

function PlayerControls({
  isPlaying,
  handlePlayPause,
  handleNextTrack,
  handlePreviousTrack,
  shuffle,
  setShuffle,
  repeat,
  setRepeat,
  crossfadeEnabled,
  setCrossfadeEnabled,
  setShowEqualizer,
  setShowQueue,
  setShowInfo,
}) {
  const CrossfadeIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m-8-8h16" />
    </svg>
  );

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4">
      <button
        onClick={() => {
          setShuffle(!shuffle);
          localStorage.setItem('shuffle', !shuffle);
        }}
        className={classNames(
          'p-2 rounded-full text-muted-foreground hover:text-primary transition-all',
          shuffle && 'text-primary ring-2 ring-primary ring-offset-2 ring-offset-background'
        )}
        aria-label="Shuffle toggle"
      >
        <Shuffle size={24} />
      </button>
      <button
        onClick={handlePreviousTrack}
        className="p-2 rounded-full text-muted-foreground hover:text-primary transition-all"
        aria-label="Previous track"
      >
        <SkipBack size={24} />
      </button>
      <button
        onClick={handlePlayPause}
        className="p-3 rounded-full bg-primary text-white hover:bg-green-600 transition-all"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause size={28} /> : <Play size={28} />}
      </button>
      <button
        onClick={handleNextTrack}
        className="p-2 rounded-full text-muted-foreground hover:text-primary transition-all"
        aria-label="Next track"
      >
        <SkipForward size={24} />
      </button>
      <button
        onClick={() => {
          const nextRepeat = repeat === 'none' ? 'all' : repeat === 'all' ? 'one' : 'none';
          setRepeat(nextRepeat);
          localStorage.setItem('repeat', nextRepeat);
        }}
        className={classNames(
          'p-2 rounded-full text-muted-foreground hover:text-primary transition-all',
          repeat !== 'none' && 'text-primary ring-2 ring-primary ring-offset-2 ring-offset-background'
        )}
        aria-label="Repeat toggle"
      >
        <Repeat size={24} />
        {repeat === 'one' && <span className="absolute top-0 right-0 text-xs text-primary">1</span>}
      </button>
      <button
        onClick={() => {
          setCrossfadeEnabled(!crossfadeEnabled);
          localStorage.setItem('crossfadeEnabled', !crossfadeEnabled);
        }}
        className={classNames(
          'p-2 rounded-full text-muted-foreground hover:text-primary transition-all',
          crossfadeEnabled && 'text-primary ring-2 ring-primary ring-offset-2 ring-offset-background'
        )}
        aria-label="Crossfade toggle"
      >
        <CrossfadeIcon />
      </button>
      <button
        onClick={() => setShowEqualizer((prev) => !prev)}
        className="p-2 rounded-full text-muted-foreground hover:text-primary transition-all"
        aria-label="Equalizer toggle"
      >
        <Sliders size={24} />
      </button>
      <button
        onClick={() => setShowQueue((prev) => !prev)}
        className="p-2 rounded-full text-muted-foreground hover:text-primary transition-all"
        aria-label="Queue toggle"
      >
        <List size={24} />
      </button>
      <button
        onClick={() => setShowInfo((prev) => !prev)}
        className="p-2 rounded-full text-muted-foreground hover:text-primary transition-all"
        aria-label="Info toggle"
      >
        <Info size={24} />
      </button>
    </div>
  );
}

export default PlayerControls;