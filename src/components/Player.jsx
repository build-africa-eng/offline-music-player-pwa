import { useEffect, useRef, useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { Play, Pause, Volume2, Moon, Sun, Sliders, Info, List, SkipBack, SkipForward, Shuffle, Repeat } from 'lucide-react';
import { extractMetadata } from '../lib/metadata';
import { applyCrossfade } from '../lib/audio';
import WaveformVisualizer from './WaveformVisualizer';
import LyricsDisplay from './LyricsDisplay';
import Equalizer from './Equalizer';
import NowPlayingModal from './NowPlayingModal';
import QueueView from './QueueView';
import toast from 'react-hot-toast';

function Player() {
  const {
    currentFile, selectSong, fileMapRef,
    queue, setQueue, shuffle, setShuffle, repeat, setRepeat
  } = useMusic();

  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => parseFloat(localStorage.getItem('playerVolume')) || 1);
  const [metadata, setMetadata] = useState({ title: 'Unknown', artist: 'Unknown', artwork: null, album: 'Unknown' });
  const [showVolume, setShowVolume] = useState(false);
  const [showEqualizer, setShowEqualizer] = useState(false);
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    if (!currentFile) {
      setMetadata({ title: 'Unknown', artist: 'Unknown', artwork: null, album: 'Unknown' });
      setIsPlaying(false);
      return;
    }

    extractMetadata(currentFile)
      .then(data => {
        setMetadata({
          title: data.title || currentFile.name,
          artist: data.artist || 'Unknown',
          artwork: data.picture || null,
          album: data.album || 'Unknown'
        });
      })
      .catch(err => {
        console.error('Metadata error:', err);
        toast.error('Failed to load song metadata.');
      });

    if (audioRef.current) {
      audioRef.current.load();
    }
  }, [currentFile]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      localStorage.setItem('playerVolume', volume);
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = async () => {
      if (repeat === 'one') {
        audio.currentTime = 0;
        audio.play().catch(err => {
          console.error('Playback error:', err);
          toast.error('Failed to replay song.');
        });
      } else {
        await handleNextTrack();
      }
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [repeat, queue]);

  useEffect(() => {
    const handleKeydown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      switch (e.key) {
        case ' ':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowRight':
          handleNextTrack();
          break;
        case 'ArrowLeft':
          handlePreviousTrack();
          break;
        case 'ArrowUp':
          setVolume(prev => Math.min(prev + 0.1, 1));
          break;
        case 'ArrowDown':
          setVolume(prev => Math.max(prev - 0.1, 0));
          break;
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  const onTimeUpdate = () => {
    const audio = audioRef.current;
    if (audio) {
      setProgress(audio.currentTime);
      setDuration(audio.duration || 0);
    }
  };

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (audio.paused) {
        audio.play()
          .then(() => setIsPlaying(true))
          .catch(err => {
            console.error('Playback error:', err);
            toast.error('Failed to play song.');
          });
      } else {
        audio.pause();
        setIsPlaying(false);
      }
    } catch (err) {
      console.error('Play/pause error:', err);
      toast.error('Playback error.');
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    const value = parseFloat(e.target.value);
    if (audio && !isNaN(value)) {
      audio.currentTime = value;
      setProgress(value);
    }
  };

  const handleVolumeChange = (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) setVolume(value);
  };

  const handlePreviousTrack = () => {
    if (!queue.length || !currentFile) return;
    const currentIndex = queue.findIndex(song => song.id === currentFile.id);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : queue.length - 1;
    selectSong(queue[prevIndex].id);
  };

  const handleNextTrack = async () => {
    if (!queue.length || !currentFile) return;
    let nextIndex;
    const currentIndex = queue.findIndex(song => song.id === currentFile.id);

    if (shuffle && queue.length > 1) {
      do {
        nextIndex = Math.floor(Math.random() * queue.length);
      } while (nextIndex === currentIndex);
    } else {
      nextIndex = currentIndex < queue.length - 1 ? currentIndex + 1 : 0;
    }

    const nextSong = queue[nextIndex];
    if (nextSong) {
      const nextFile = fileMapRef.current.get(nextSong.id);
      if (!nextFile) {
        toast.error('Next song file not found.');
        return;
      }
      try {
        const nextAudio = new Audio(URL.createObjectURL(nextFile));
        await applyCrossfade(audioRef.current, nextAudio, () => selectSong(nextSong.id), 1000);
      } catch (err) {
        console.error('Crossfade error:', err);
        toast.error('Failed to play next song.');
      }
    }
  };

  const toggleShuffle = () => {
    const newShuffle = !shuffle;
    setShuffle(newShuffle);
    localStorage.setItem('playerShuffle', JSON.stringify(newShuffle));
    if (newShuffle) {
      setQueue(prev => [...prev].sort(() => Math.random() - 0.5));
    } else {
      setQueue(prev => prev.sort((a, b) => a.id.localeCompare(b.id)));
    }
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
    <div className="fixed bottom-0 left-0 right-0 bg-background/80 dark:bg-gray-900/80 backdrop-blur-sm p-2 sm:p-3 flex flex-col gap-2 z-50 shadow-md">
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        {/* Artwork (Mobile Hidden) */}
        <div className="hidden sm:flex items-center">
          {metadata.artwork ? (
            <img
              src={URL.createObjectURL(new Blob([metadata.artwork.data], { type: metadata.artwork.format }))}
              alt="Album art"
              className="w-10 h-10 rounded sm:w-12 sm:h-12"
            />
          ) : (
            <div className="w-10 h-10 rounded bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-sm sm:w-12 sm:h-12">
              🎶
            </div>
          )}
        </div>

        {/* Track Info */}
        <div className="flex-1 flex flex-col items-start min-w-0">
          <span className="font-semibold text-xs sm:text-sm truncate dark:text-white">{metadata.title}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{metadata.artist}</span>
          <div className="flex items-center gap-1 w-full mt-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">{formatTime(progress)}</span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={progress}
              onChange={handleSeek}
              className="flex-1 h-1 accent-primary touch-none rounded"
              style={{ touchAction: 'none' }}
              aria-label="Seek track"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={toggleShuffle}
            className={`p-2 rounded-full ${shuffle ? 'text-primary' : 'text-gray-600 dark:text-gray-400'} hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}
            aria-label="Toggle shuffle"
          >
            <Shuffle size={16} className="sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={toggleRepeat}
            className={`relative p-2 rounded-full ${repeat !== 'off' ? 'text-primary' : 'text-gray-600 dark:text-gray-400'} hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}
            aria-label={`Repeat ${repeat}`}
          >
            <Repeat size={16} className="sm:w-5 sm:h-5" />
            {repeat === 'one' && (
              <span className="absolute bottom-0 right-0 text-[8px] bg-primary text-white rounded-full w-3 h-3 flex items-center justify-center">1</span>
            )}
          </button>
          <button
            onClick={handlePreviousTrack}
            className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Previous track"
          >
            <SkipBack size={16} className="sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={handlePlayPause}
            className="p-2 rounded-full bg-primary text-white hover:bg-secondary transition-colors"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={20} className="sm:w-6 sm:h-6" /> : <Play size={20} className="sm:w-6 sm:h-6" />}
          </button>
          <button
            onClick={handleNextTrack}
            className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Next track"
          >
            <SkipForward size={16} className="sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => setShowEqualizer(!showEqualizer)}
            className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors hidden sm:block"
            aria-label="Toggle equalizer"
          >
            <Sliders size={16} className="sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => setShowNowPlaying(true)}
            className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors hidden sm:block"
            aria-label="Now playing"
          >
            <Info size={16} className="sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => setShowQueue(!showQueue)}
            className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle queue"
          >
            <List size={16} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Volume Control */}
        <div className="relative">
          <button
            onClick={() => setShowVolume(!showVolume)}
            className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle volume"
          >
            <Volume2 size={16} className="sm:w-5 sm:h-5" />
          </button>
          {showVolume && (
            <div className="absolute bottom-12 right-0 w-20 bg-background dark:bg-gray-800 shadow-lg rounded p-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full h-1 accent-primary rounded-full touch-none"
                orient="vertical"
                aria-label="Adjust volume"
              />
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setDark(!dark)}
          className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark ? <Sun size={16} className="sm:w-5 sm:h-5" /> : <Moon size={16} className="sm:w-5 sm:h-5" />}
        </button>
      </div>

      {/* Waveform (Hidden on Mobile) */}
      <div className="hidden sm:block">
        <WaveformVisualizer audioFile={currentFile} />
      </div>

      {/* Lyrics (Hidden on Mobile) */}
      <div className="hidden sm:block">
        <LyricsDisplay key={currentFile?.id} songId={currentFile?.id} title={metadata.title} artist={metadata.artist} />
      </div>

      {/* Popovers */}
      {showEqualizer && <Equalizer audioRef={audioRef} />}
      {showQueue && <QueueView />}
      <NowPlayingModal isOpen={showNowPlaying} onClose={() => setShowNowPlaying(false)} metadata={metadata} />

      <audio ref={audioRef} src={currentFile && URL.createObjectURL(currentFile)} onTimeUpdate={onTimeUpdate} />
    </div>
  );
}

export default Player;