import { useEffect, useRef, useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { Play, Pause, Volume2, Upload, Moon, Sun } from 'lucide-react';
import { extractMetadata } from '../lib/metadata';

function Player() {
  const { currentFile, handleUpload } = useMusic();
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('playerVolume');
    return saved !== null ? parseFloat(saved) : 1;
  });
  const [metadata, setMetadata] = useState({ title: 'Unknown', artist: 'Unknown', artwork: null });

  // Dark mode toggle
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    if (!currentFile) {
      setMetadata({ title: 'Unknown', artist: 'Unknown', artwork: null });
      return;
    }
    extractMetadata(currentFile).then(data => {
      setMetadata({
        title: data.title || currentFile.name,
        artist: data.artist || 'Unknown',
        artwork: data.picture || null
      });
    });
    audioRef.current.load();
  }, [currentFile]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      localStorage.setItem('playerVolume', volume);
    }
  }, [volume]);

  const onTimeUpdate = () => {
    const audio = audioRef.current;
    setProgress(audio.currentTime);
    setDuration(audio.duration || 0);
  };

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (audio.paused) {
      audio.play().then(() => setIsPlaying(true));
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = e => {
    const audio = audioRef.current;
    audio.currentTime = e.target.value;
    setProgress(audio.currentTime);
  };

  const handleVolumeChange = e => setVolume(parseFloat(e.target.value));

  const formatTime = s => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`; // Fixed syntax
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/70 dark:bg-background-dark/70 backdrop-blur-md p-4 flex items-center space-x-4 z-50">
      {/* Theme Toggle */}
      <button onClick={() => setDark(!dark)} className="p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700">
        {dark ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Upload Button */}
      <button onClick={() => fileInputRef.current.click()} className="p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700">
        <Upload size={20} />
        <input
          type="file"
          accept="audio/*"
          className="hidden"
          ref={fileInputRef}
          onChange={e => handleUpload(e.target.files[0])}
        />
      </button>

      {/* Artwork */}
      {metadata.artwork ? (
        <img
          src={URL.createObjectURL(new Blob([metadata.artwork.data], { type: metadata.artwork.format }))}
          alt="art"
          className="w-12 h-12 rounded"
        />
      ) : (
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded flex items-center justify-center">
          🎵
        </div>
      )}

      {/* Track Info */}
      <div className="flex-1 flex flex-col">
        <span className="font-semibold truncate">{metadata.title}</span>
        <span className="text-sm text-gray-600 dark:text-gray-400 truncate">{metadata.artist}</span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={progress}
          onChange={handleSeek}
          className="w-full h-1 mt-1 accent-primary"
        />
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {formatTime(progress)} / {formatTime(duration)}
        </div>
      </div>

      {/* Play/Pause */}
      <button onClick={handlePlayPause} className="p-2 rounded-full bg-primary text-white hover:bg-secondary transition-colors">
        {isPlaying ? <Pause size={24} /> : <Play size={24} />}
      </button>

      {/* Volume Control */}
      <div className="flex items-center space-x-1">
        <Volume2 size={20} />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={handleVolumeChange}
          className="w-20 h-1 accent-primary"
        />
      </div>

      <audio ref={audioRef} src={currentFile && URL.createObjectURL(currentFile)} onTimeUpdate={onTimeUpdate} />
    </div>
  );
}

export default Player;