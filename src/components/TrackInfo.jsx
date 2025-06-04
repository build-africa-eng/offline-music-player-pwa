import { formatTime } from '../lib/utils';

function TrackInfo({ metadata, progress, duration, handleSeek }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <h2 className="text-lg sm:text-xl font-semibold text-center truncate w-full">{metadata.title}</h2>
      <p className="text-sm text-muted-foreground truncate w-full text-center">{metadata.artist}</p>
      <div className="w-full flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{formatTime(progress * duration)}</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={progress}
          onChange={(e) => handleSeek(parseFloat(e.target.value))}
          className="w-full h-2 rounded-full appearance-none bg-gray-300 dark:bg-gray-700 accent-primary"
        />
        <span className="text-sm text-muted-foreground">{formatTime(duration)}</span>
      </div>
    </div>
  );
}

export default TrackInfo;