import { useState, useEffect, useRef } from 'react';
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
import { Play, Pause, Upload } from 'lucide-react';

function Player({ queue, currentFile, fileMapRef, selectSong, waveform }) {
  const { getLyrics, handleUploadLyrics } = useMusic();
  const [showEqualizer, setShowEqualizer] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);

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

  const handleLyricsUpload = (e) => {
    const file = e.target.files[0];
    if (file && currentFile) {
      handleUploadLyrics(file, currentFile.id);
    }
  };

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

      {currentFile ? (
        <>
          <div className="flex flex-col items-center gap-4 w-full max-w-4xl">
            <Artwork artwork={currentFile.picture} title={currentFile.title} />
            <TrackInfo
              metadata={currentFile}
              progress={progress}
              duration={duration}
              onSeek={handleSeek}
            />
            <div className="flex items-center gap-2">
              <label className="cursor-pointer flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-primary">
                <Upload className="w-4 h-4" />
                Upload Lyrics (.lrc)
                <input
                  type="file"
                  accept=".lrc"
                  onChange={handleLyricsUpload}
                  className="hidden"
                />
              </label>
              {getLyrics(currentFile.id) && (
                <button
                  onClick={() => setShowLyrics(!showLyrics)}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary"
                >
                  {showLyrics ? 'Hide Lyrics' : 'Show Lyrics'}
                </button>
              )}
            </div>
            {showLyrics && <LyricsDisplay songId={currentFile.id} />}
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
            <NowPlayingModal
              metadata={currentFile}
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
            />
          )}
        </>
      ) : (
        <div className="w-full text-center py-20 text-gray-500 dark:text-gray-400">
          <p className="text-lg font-medium">Select a song to begin playing 🎶</p>
        </div>
      )}
    </div>
  );
}

export default Player;