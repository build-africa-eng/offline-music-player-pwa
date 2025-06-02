import { useEffect, useRef, useState } from 'react';
import { useMusic } from '../context/MusicContext';
import {
  Play, Pause, Volume2, Moon, Sun, Sliders, Info, List,
  SkipBack, SkipForward, Shuffle, Repeat
} from 'lucide-react';
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

    audioRef.current.load();
  }, [currentFile]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      localStorage.setItem('playerVolume', volume);
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    const handleEnded = async () => {
      if (repeat === 'one') {
        audio.currentTime = 0;
        audio.play();
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
    setProgress(audio.currentTime);
    setDuration(audio.duration || 0);
  };

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
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
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
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
    if (shuffle) {
      do {
        nextIndex = Math.floor(Math.random() * queue.length);
      } while (nextIndex === currentIndex && queue.length > 1);
    } else {
      nextIndex = currentIndex < queue.length - 1 ? currentIndex + 1 : 0;
    }

    const nextSong = queue[nextIndex];
    if (nextSong) {
      const nextFile = fileMapRef.current.get(nextSong.id);
      if (!nextFile) return;
      const nextAudio = new Audio(URL.createObjectURL(nextFile));
      await applyCrossfade(audioRef.current, nextAudio, () => selectSong(nextSong.id), 1000);
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
    <div>
      {/* Your UI JSX here, omitted for brevity */}
    </div>
  );
}

export default Player;