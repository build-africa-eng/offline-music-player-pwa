import { useEffect, useRef, useState } from 'react';
import { extractMetadata } from '../lib/metadata';

function Player({ file, onFileSelect }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    const savedVolume = localStorage.getItem('playerVolume');
    return savedVolume !== null ? parseFloat(savedVolume) : 1;
  });
  const [objectUrl, setObjectUrl] = useState(null);
  const [metadata, setMetadata] = useState({ title: 'Unknown', artist: 'Unknown' });
  const [isDragging, setIsDragging] = useState(false);

  // Handle object URL and metadata
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setObjectUrl(url);
      extractMetadata(file).then(data => {
        setMetadata({
          title: data.title || file.name,
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
  }, [file]);

  // Persist volume
  useEffect(() => {
    localStorage.setItem('playerVolume', volume);
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Handle play/pause
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

  // Update progress and duration
  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (audio) {
      setProgress(audio.currentTime);
      setDuration(audio.duration || 0);
    }
  };

  // Seek to position
  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = e.target.value;
      setProgress(e.target.value);
    }
  };

  // Adjust volume
  const handleVolumeChange = (e) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
  };

  // Format time (mm:ss)
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('audio/')) {
      onFileSelect(droppedFile);
    }
  };

  return (
    <div className="p-4 bg-background text-text rounded-lg shadow-md mb-4 w-full max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-2">Now Playing</h2>
      <div
        className={`mb-4 p-4 border-2 border-dashed rounded-lg transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'border-gray-300'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p className="text-sm text-center text-text">
          Drag & drop an audio file here
        </p>
      </div>
      {file && objectUrl ? (
        <>
          <audio
            ref={audioRef}
            src={objectUrl}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            autoPlay
          />
          <div className="mb-2 text-sm truncate">
            <strong>{metadata.title}</strong> - {metadata.artist}
          </div>

          <div className="flex items-center space-x-4 flex-wrap">
            <button
              onClick={handlePlayPause}
              className="bg-primary hover:bg-secondary text-white px-3 py-1 rounded transition-colors"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>

            <input
              type="range"
              min="0"
              max={duration || 0}
              value={progress}
              onChange={handleSeek}
              className="flex-1 w-full sm:w-auto"
              aria-label="Seek"
            />

            <span className="text-xs w-16 text-right">
              {formatTime(progress)} / {formatTime(duration)}
            </span>
          </div>

          <div className="mt-2 flex items-center space-x-2">
            <label className="text-sm">Volume</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-24 sm:w-32"
              aria-label="Volume"
            />
          </div>
        </>
      ) : (
        <p className="text-text text-sm">No song selected</p>
      )}
    </div>
  );
}

export default Player;