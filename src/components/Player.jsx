import { useState } from 'react';
import { usePlayerLogic } from '../hooks/usePlayerLogic';
import PlayerControls from './PlayerControls';
import TrackInfo from './TrackInfo';
import Artwork from './Artwork';
import VolumeControl from './VolumeControl';
import ThemeToggle from './ThemeToggle';
import PlayerFooter from './PlayerFooter';
import Popups from './Popups';
import NowPlayingBar from './NowPlayingBar';
import { Play, Pause } from 'lucide-react';

function Player({ queue, currentFile, fileMapRef, selectSong, waveform }) {
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
  } = usePlayerLogic({ queue, currentFile, fileMapRef, selectSong });

  if (!currentFile) return null;

  return (
    <div className="relative flex flex-col items-center justify-between gap-4 w-full min-h-screen bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between w-full max-w-4xl mx-auto mt-4">
        <ThemeToggle />
        <VolumeControl
          volume={volume}
          setVolume={setVolume}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
        />
      </div>
      <div className="flex flex-col items-center gap-4">
        <Artwork artwork={currentFile.artwork} title={currentFile.title} />
        <TrackInfo
          metadata={currentFile}
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
        songId={currentFile.id}
        metadata={currentFile}
        progress={progress}
        duration={duration}
        waveform={waveform}
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
        metadata={currentFile}
      />
      {isPlaying && (
        <NowPlayingBar
          metadata={currentFile}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
        />
      )}
    </div>
  );
}

export default Player;