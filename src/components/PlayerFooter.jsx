import LyricsDisplay from './LyricsDisplay';
import Waveform from './Waveform';

function PlayerFooter({ songId, metadata, progress, duration, waveform }) {
  return (
    <footer className="hidden lg:flex flex-col gap-4 w-full p-4 bg-gray-200 dark:bg-gray-800 rounded-lg">
      <LyricsDisplay songId={songId} progress={progress} isPlaying={false} /> {/* Assume not playing in footer */}
      <Waveform waveformData={waveform} progress={progress} duration={duration} />
    </footer>
  );
}

export default PlayerFooter;