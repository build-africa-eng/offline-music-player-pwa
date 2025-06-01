import { useEffect, useRef, useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { Play, Pause, Volume2, Moon, Sun, SkipBack, SkipForward, Shuffle, Repeat } from 'lucide-react';
import { extractMetadata } from '../lib/metadata';

function Player() {
  const { currentFile, selectSong, queue, setQueue, shuffle, setShuffle, repeat, setRepeat } = useMusic();
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('playerVolume');
    return saved !== null ? parseFloat(saved) : 1;
  });
  const [metadata, setMetadata] = useState({ title: 'Unknown', artist: 'Unknown', artwork: null });
  const [showVolume, setShowVolume] = useState(false);

  // Dark mode toggle
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  // Load metadata
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

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      localStorage.setItem('playerVolume', volume);
    }
  }, [volume]);

  // Handle playback end
  useEffect(() => {
    const audio = audioRef.current;
    const handleEnded = () => {
      if (repeat === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else {
        handleNextTrack();
      }
    };
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [repeat, queue]);

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

  const handlePreviousTrack = () => {
    if (!queue.length) return;
    const currentIndex = queue.findIndex(song => song.id === currentFile?.id);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : queue.length - 1;
    selectSong(queue[prevIndex].id);
  };

  const handleNextTrack = () => {
    if (!queue.length) return;
    let nextIndex;
    const currentIndex = queue.findIndex(song => song.id === currentFile?.id);
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = currentIndex < queue.length - 1 ? currentIndex + 1 : 0;
    }
    selectSong(queue[nextIndex].id);
  };

  const toggleShuffle = () => {
    setShuffle(!shuffle);
    if (!shuffle) {
      const shuffled = [...queue].sort(() => Math.random() - 0.5);
      setQueue(shuffled);
    } else {
      // Restore original queue (assumes queue is library or playlist order)
      setQueue(queue.sort((a, b) => a.id.localeCompare(b.id)));
    }
    localStorage.setItem('playerShuffle', JSON.stringify(!shuffle));
  };

  const toggleRepeat = () => {
    const nextRepeat = repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off';
    setRepeat(nextRepeat);
    localStorage.setItem('playerRepeat', nextRepeat);
  };

  const formatTime = s => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/90 dark:bg-background-dark/90 backdrop-blur-md p-3 sm:p-4 flex items-center gap-2 sm:gap-4 z-50 shadow-lg">
      {/* Artwork */}
      <div className="hidden sm:block">
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
      </div>

      {/* Track Info */}
      <div className="flex-1 flex flex-col">
        <span className="font-semibold text-sm sm:text-base truncate">{metadata.title}</span>
        <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{metadata.artist}</span>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-600 dark:text-gray-400">{formatTime(progress)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={progress}
            onChange={handleSeek}
            className="flex-1 h-1 accent-primary touch-none"
          />
          <span className="text-xs text-gray-600 dark:text-gray-400">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={toggleShuffle}
          className={`p-2 rounded-full ${shuffle ? 'text-primary' : 'text-gray-600 dark:text-gray-400'} hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}
          aria-label="Toggle shuffle"
        >
          <Shuffle size={20} />
        </button>
        <div className="relative">
        <button
          onClick={toggleRepeat}
          className={`p-2 rounded-full ${repeat !== 'off' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'} hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}
          aria-label={`Repeat ${repeat}`}
        >
          <Repeat size={20} />
          {repeat === 'one' && <span className="absolute top-0 right-0 text-xs text-blue-600 dark:text-blue-400 rounded-full w-4 h-4 flex items-center justify-center">1</span>}
        </button>
        </div>
        <button
          onClick={handlePreviousTrack}
          className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Previous track"
        >
          <SkipBack size={20} />
        </button>
        <button
          onClick={handlePlayPause}
          className="p-2 rounded-full bg-primary text-white hover:bg-secondary transition-colors"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>
        <button
          onClick={handleNextTrack}
          className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Next track"
        >
          <SkipForward size={20} />
        </button>
      </div>

      {/* Volume Control (Popover) */}
      <div className="relative">
        <button
          onClick={() => setShowVolume(!showVolume)}
          className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle volume control"
        >
          <Volume2 size={20} />
        </button>
        {showVolume && (
          <div className="absolute bottom-12 right-0 w-24 bg-background dark:bg-background-dark shadow-lg rounded-lg p-2">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={handleVolumeChange}
              className="w-full h-1 accent-primary"
              orient="vertical"
            />
          </div>
        )}
      </div>

      {/* Theme Toggle */}
      <button
        onClick={() => setDark(!dark)}
        className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Toggle theme"
      >
        {dark ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <audio ref={audioRef} src={currentFile && URL.createObjectURL(currentFile)} onTimeUpdate={onTimeUpdate} />
    </div>
  );
}

export default Player;