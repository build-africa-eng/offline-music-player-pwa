import { useEffect, useRef, useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { extractMetadata } from '../lib/metadata';

function Player() {
  const { currentFile, handleUpload } = useMusic();
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    const savedVolume = localStorage.getItem('playerVolume');
    return savedVolume !== null ? parseFloat(savedVolume) : 1;
  });
  const [objectUrl, setObjectUrl] = useState(null);
  const [metadata, setMetadata] = useState({ title: 'Unknown', artist: 'Unknown' });

  useEffect(() => {
    if (currentFile) {
      const url = URL.createObjectURL(currentFile);
      setObjectUrl(url);
      extractMetadata(currentFile).then(data => {
        setMetadata({
          title: data.title || currentFile.name,
          artist: data.artist || 'Unknown'
        });
      });
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setObjectUrl(null);
      setMetadata({ title: 'Unknown', artist: 'Unknown' });
    }
  }, [currentFile]);

  useEffect(() => {
    localStorage.setItem('playerVolume', volume);
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(err => console.error('Playback error:', err));
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (audio) {
      setProgress(audio.currentTime);
      setDuration(audio.duration || 0);
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = e.target.value;
      setProgress(e.target.value);
    }
  };

  const handleVolumeChange = (e) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  };

  const handleFileInput = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type.startsWith('audio/')) {
      handleUpload(selectedFile);
    }
  };

  return (
    <div className="p-3 sm:p-4 bg-background/80 text-text rounded-lg shadow-md mb-4 w-full max-w-lg mx-auto backdrop-blur-sm">
      <h2 className="text-lg sm:text-xl font-semibold mb-2">Now Playing</h2>
      <div className="mb-3">
        <button
          onClick={() => fileInputRef.current.click()}
          className="w-full bg-primary hover:bg-secondary text-white text-sm sm:text-base py-2 px-3 rounded-lg transition-colors"
        >
          Upload Audio File
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInput}
          accept="audio/*"
          className="hidden"
        />
      </div>
      {currentFile && objectUrl ? (
        <>
          <audio
            ref={audioRef}
            src={objectUrl}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            autoPlay
          />
          <div className="mb-2 text-xs sm:text-sm truncate">
            <strong>{metadata.title}</strong> - {metadata.artist}
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4 flex-wrap gap-2">
            <button
              onClick={handlePlayPause}
              className="bg-primary hover:bg-secondary text-white px-2 sm:px-3 py-1 rounded transition-colors text-sm sm:text-base"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>

            <input
              type="range"
              min="0"
              max={duration || 0}
              value={progress}
              onChange={handleSeek}
              className="flex-1 w-full"
              aria-label="Seek"
            />

            <span className="text-xs w-14 sm:w-16 text-right">
              {formatTime(progress)} / {formatTime(duration)}
            </span>
          </div>

          <div className="mt-2 flex items-center space-x-2">
            <label className="text-xs sm:text-sm">Volume</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-20 sm:w-32"
              aria-label="Volume"
            />
          </div>
        </>
      ) : (
        <p className="text-text text-xs sm:text-sm">No song selected</p>
      )}
    </div>
  );
}

export default Player;