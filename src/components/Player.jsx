import { useState, useEffect } from 'react';
import { useMusic } from '../context/MusicContext';
import { usePlayerLogic } from '../hooks/usePlayerLogic';
import PlayerControls from './PlayerControls';
import TrackInfo from './TrackInfo';
import Artwork from './Artwork';
import VolumeControl from './VolumeControl';
import ThemeToggle from './ThemeToggle';
import PlayerFooter from './PlayerFooter';
import Popups from './Popups';
import NowPlayingModal from './NowPlayingModal';
import LyricsDisplay from './LyricsDisplay';
import { Play, Pause, Upload, SkipBack, SkipForward, Maximize2, Minimize2 } from 'lucide-react';

function Player() {
  const {
    currentFile,
    isPlaying,
    togglePlayPause,
    skipTrack,
    playerMode,
    setPlayerMode,
    getLyrics,
    handleUploadLyrics,
    queue,
    fileMapRef,
    selectSong,
  } = useMusic();

  const [showEqualizer, setShowEqualizer] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);

  const {
    audioRef,
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
    handleNextTrack,
    handlePreviousTrack,
    handleSeek,
  } = usePlayerLogic({ queue, currentFile, fileMapRef, selectSong });

  // Manage all side effects in a single useEffect
  useEffect(() => {
    // Sync isPlaying with usePlayerLogic
    if (isPlaying !== audioRef.current.paused) {
      togglePlayPause();
    }

    // Handle body scroll for full player
    if (playerMode === 'full') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    // Cleanup
    return () => {
      document.body.style.overflow = '';
    };
  }, [isPlaying, playerMode, togglePlayPause, audioRef]);

  const handleLyricsUpload = (e) => {
    const file = e.target.files[0];
    if (file && currentFile) {
      handleUploadLyrics(file, currentFile.id);
    }
  };

  // Render logic outside hook calls
  const renderPlayer = () => {
    if (!currentFile) {
      return (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-3 backdrop-blur-sm border-t border-gray-700 z-50">
          <p className="text-center text-sm">No song selected</p>
        </div>
      );
    }

    return playerMode === 'mini' ? (
      // Mini Player
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-3 backdrop-blur-sm border-t border-gray-700 z-50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{currentFile.title}</p>
            <p className="text-xs text-gray-400 truncate">{currentFile.artist}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => skipTrack('prev')}
              className="p-1 text-white hover:text-primary transition-colors"
              aria-label="Previous track"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={togglePlayPause}
              className="p-1 text-white hover:text-primary transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
            <button
              onClick={() => skipTrack('next')}
              className="p-1 text-white hover:text-primary transition-colors"
              aria-label="Next track"
            >
              <SkipForward className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPlayerMode('full')}
              className="p-1 text-white hover:text-primary transition-colors"
              aria-label="Expand player"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    ) : (
      // Full Player
      <div className="fixed inset-0 bg-gray-900 text-white p-4 sm:p-6 backdrop-blur-sm z-50 flex flex-col">
        <div className="flex items-center justify-between w-full max-w-4xl mx-auto">
          <button
            onClick={() => setPlayerMode('mini')}
            className="p-1 text-white hover:text-primary transition-colors"
            aria-label="Minimize player"
          >
            <Minimize2 className="w-6 h-6" />
          </button>
          <ThemeToggle />
          <VolumeControl
            volume={volume}
            setVolume={setVolume}
            isMuted={isMuted}
            setIsMuted={setIsMuted}
          />
        </div>

        <div className="flex flex-col items-center gap-4 w-full max-w-4xl mx-auto flex-1">
          <Artwork artwork={currentFile.picture} title={currentFile.title} />
          <TrackInfo
            metadata={currentFile}
            progress={progress}
            duration={duration}
            onSeek={handleSeek}
          />
          <div className="flex items-center gap-2">
            <label
              className="cursor-pointer flex items-center gap-1 text-sm text-gray-400 hover:text-primary"
              htmlFor="lyrics-upload"
            >
              <Upload className="w-4 h-4" />
              Upload Lyrics (.lrc)
              <input
                id="lyrics-upload"
                type="file"
                accept=".lrc"
                onChange={handleLyricsUpload}
                className="hidden"
                aria-label="Upload lyrics file in LRC format"
              />
            </label>
            {getLyrics(currentFile.id) && (
              <button
                onClick={() => setShowLyrics(!showLyrics)}
                className="text-sm text-gray-400 hover:text-primary"
                aria-label={showLyrics ? 'Hide lyrics' : 'Show lyrics'}
              >
                {showLyrics ? 'Hide Lyrics' : 'Show Lyrics'}
              </button>
            )}
          </div>
          {showLyrics && <LyricsDisplay songId={currentFile.id} />}
          <PlayerControls
            isPlaying={isPlaying}
            onPlayPause={togglePlayPause}
            onNext={() => skipTrack('next')}
            onPrev={() => skipTrack('prev')}
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
          <NowPlayingModal
            metadata={currentFile}
            isPlaying={isPlaying}
            onPlayPause={togglePlayPause}
          />
        )}
      </div>
    );
  };

  return renderPlayer();
}

export default Player;