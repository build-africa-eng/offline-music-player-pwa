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
import classNames from 'classnames';

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
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
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
      audioRef.current.src = URL.createObjectURL(currentFile);
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch(err => {
          console.error('Auto-play error:', err);
          toast.error(`Failed to auto-play: ${err.message}`);
          setIsPlaying(false);
        });
      }
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
          console.error('Replay error:', err);
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
    if (!audio || !currentFile) {
      toast.error('No song selected or audio not ready.');
      return;
    }

    if (audio.paused) {
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.error('Playback error:', err);
          toast.error(`Failed to play song: ${err.message}`);
        });
    } else {
      audio.pause();
      setIsPlaying(false);
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

  const artSrc = metadata.artwork
    ? URL.createObjectURL(new Blob([metadata.artwork.data], { type: metadata.artwork.format }))
    : '/logo.png'; // Fallback to logo if no artwork

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/80 dark:bg-zinc-900/80 shadow-lg z-50">
      {/* Main Player Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md transition-all">
        {/* Artwork */}
        <div className="flex-shrink-0">
          <img
            src={artSrc}
            alt={metadata.title === 'Unknown' ? 'App Logo' : `${metadata.title} artwork`}
            className="w-12 h-12 rounded-2xl object-cover shadow-md"
            onError={(e) => {
              console.error('Artwork/Logo load error:', e);
              e.target.src = '/logo.png';
            }}
          />
        </div>

        {/* Track Info + Seek */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-medium text-white truncate">{metadata.title}</h3>
              <p className="text-sm text-muted-foreground truncate">{metadata.artist}</p>
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={progress}
            onChange={handleSeek}
            className="w-full h-2 rounded-full appearance-none bg-gray-300 dark:bg-gray-700 accent-primary"
            style={{
              background: `linear-gradient(to right, #1db954 ${((progress / duration) * 100 || 0)}%, #ccc ${((progress / duration) * 100 || 0)}%)`
            }}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={toggleShuffle}
            className={classNames(
              'p-2 rounded-full text-muted-foreground hover:text-primary transition-all',
              shuffle && 'text-primary ring-2 ring-primary ring-offset-2 ring-offset-background'
            )}
            aria-label="Toggle shuffle"
          >
            <Shuffle size={24} />
          </button>
          <button
            onClick={toggleRepeat}
            className={classNames(
              'p-2 rounded-full text-muted-foreground hover:text-primary transition-all',
              repeat !== 'off' && 'text-primary ring-2 ring-primary ring-offset-2 ring-offset-background animate-spin'
            )}
            aria-label={`Repeat ${repeat}`}
          >
            <Repeat size={24} />
            {repeat === 'one' && <span className="absolute -top-1 -right-1 text-[10px] bg-primary text-white rounded-full w-4 h-4 flex items-center justify-center">1</span>}
          </button>
          <button
            onClick={handlePreviousTrack}
            className="p-2 rounded-full text-muted-foreground hover:text-primary hover:scale-105 transition-all"
            aria-label="Previous track"
          >
            <SkipBack size={24} />
          </button>
          <button
            onClick={handlePlayPause}
            className="p-3 rounded-full bg-primary text-white hover:bg-green-600 hover:ring-2 hover:ring-primary hover:ring-offset-2 hover:ring-offset-background transition-all shadow-md"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={28} /> : <Play size={28} />}
          </button>
          <button
            onClick={handleNextTrack}
            className="p-2 rounded-full text-muted-foreground hover:text-primary hover:scale-105 transition-all"
            aria-label="Next track"
          >
            <SkipForward size={24} />
          </button>
          <button
            onClick={() => setShowEqualizer(!showEqualizer)}
            className="p-2 rounded-full text-muted-foreground hover:text-primary transition-all hidden sm:block"
            aria-label="Toggle equalizer"
          >
            <Sliders size={24} />
          </button>
          <button
            onClick={() => setShowNowPlaying(true)}
            className="p-2 rounded-full text-muted-foreground hover:text-primary transition-all hidden sm:block"
            aria-label="Now playing"
          >
            <Info size={24} />
          </button>
          <button
            onClick={() => setShowQueue(!showQueue)}
            className="p-2 rounded-full text-muted-foreground hover:text-primary transition-all"
            aria-label="Toggle queue"
          >
            <List size={24} />
          </button>
        </div>
      </div>

      {/* Volume Control */}
      <div className="flex items-center justify-end px-4 py-2 gap-2">
        <button
          onClick={() => setShowVolume(!showVolume)}
          className="p-2 rounded-full text-muted-foreground hover:text-primary transition-all"
          aria-label="Toggle volume"
        >
          <Volume2 size={24} />
        </button>
        {showVolume && (
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-20 h-1 rounded-full appearance-none bg-gray-300 dark:bg-gray-700 accent-primary"
          />
        )}
        <button
          onClick={() => setDark(!dark)}
          className="p-2 rounded-full text-muted-foreground hover:text-primary transition-all"
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark ? <Sun size={24} /> : <Moon size={24} />}
        </button>
      </div>

      {/* Waveform (Hidden on Mobile) */}
      <div className="hidden sm:block px-4 py-2">
        <WaveformVisualizer audioFile={currentFile} className="w-full h-16 bg-gray-200 rounded-lg" />
      </div>

      {/* Lyrics (Hidden on Mobile) */}
      <div className="hidden sm:block px-4 py-2">
        <LyricsDisplay key={currentFile?.id} songId={currentFile?.id} title={metadata.title} artist={metadata.artist} />
      </div>

      {/* Popovers */}
      {showEqualizer && <Equalizer audioRef={audioRef} />}
      {showQueue && <QueueView />}
      <NowPlayingModal isOpen={showNowPlaying} onClose={() => setShowNowPlaying(false)} metadata={metadata} />

      <audio ref={audioRef} onTimeUpdate={onTimeUpdate} />
    </div>
  );
}

export default Player;