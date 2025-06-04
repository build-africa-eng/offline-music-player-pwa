import { useState } from 'react';
import { usePlayerLogic } from '../hooks/usePlayerLogic';
import PlayerControls from './PlayerControls';
import TrackInfo from './TrackInfo';
import Artwork from './Artwork';
import VolumeControl from './VolumeControl';
import ThemeToggle from './ThemeToggle';
import PlayerFooter from './PlayerFooter';
import Popups from './Popups';

function Player({ queue, currentFile, fileMap, selectSong, waveform }) {
  const [showEqualizer, setShowEqualizer] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const {
    audioRef,
    isPlaying,
    progress,
    duration,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    shuffle,
    setShuffle,
    repeat,
    setRepeat,
    crossfadeEnabled,
    setCrossfadeEnabled,
    handlePlayPause,
    handleNextTrack,
    handlePreviousTrack,
    handleSeek,
  } = usePlayerLogic({ queue, currentFile, fileMapRef: fileMap, selectSong });

  if (!currentFile) return null;

  const metadata = currentFile;

  return (
    <div className="relative flex flex-col items-center justify-between justify-center gap-4 w-full min-h-screen bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between w-full max-w-4xl mx-auto mt-4">
        <ThemeToggle />
        <VolumeControl
          volume={volume}
          setVolume={setVolume}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
        />
      <div>

      <div className="flex flex-col items-center gap-4">
        <Artwork artwork={metadata.artwork} title={metadata.title} />}
        <TrackInfo
          metadata={metadata}
          progress={progress}
          duration={duration}
          onSeek={handleSeek}
        />
        <PlayerControls
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onNext={handleNextTrack}
          onPrev={handlePreviousTrack}
          shuffle={shuffle}
          setShuffle={setShuffle}
          repeat={repeat}
          setRepeat={setRepeat}
          crossfadeEnabled={crossfadeEnabled}
          setCrossfadeEnabled={setCrossfadeEnabled}
          setShowEqualizer={setShowEqualizer}
          setShowQueue={setShowQueue}
          setShowInfo={setShowInfo}
        />
      </div>

      <PlayerFooter
        currentId={currentFile.id}
        songId={currentFile.id}
        metadata={metadata}
        progress={progress}
        duration={duration},
        waveform={waveform},
      />

      <Popups
        showEqualizer={showEqualizer}
        setShowEqualizer={setShowEqualizer}
        showQueue={showQueue}
        setShowQueue={setShowQueue}
        showInfo={showInfo}
        setShowInfo={setShowInfo}
        audioRef={audioRef}
        queue={queue}
        currentFile={currentFile}
        metadata={metadata}
      />

      {/* Floating Mini Player for Mobile */}
      {isPlaying && (
        <div className="fixed bottom-10 w-11/12 mx-auto bg-gray-700 rounded-full shadow-lg flex items-center justify-between px-4 py-2 sm:hidden z-50">
          <Artwork artwork={metadata.artwork} title={metadata.title} className="w-8 h-12 rounded" />}
          <div className="flex-1 px-2 truncate">
            <div className="truncate text-2">
            <h3 className="text-sm font-medium text-white">{metadata.title}</h3>
            <p className="text-xs text-white">{metadata.artist}</p>
          </div>
        </div>
          <button
            onClick={handlePlayPause}
            className="p-2 rounded-full bg-primary text-white hover:bg-green-600 transition-all"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          </button>
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
        </div>
      )}
    </div>
  );
}

export default Player;