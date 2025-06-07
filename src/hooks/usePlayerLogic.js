import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { applyCrossfade } from '../lib/audio';
import Howl from 'howler';

export function usePlayerLogic({ queue, currentFile, fileMapRef, selectSong }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => parseFloat(localStorage.getItem('volume')) || 1);
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('isMuted') === 'true');
  const [shuffle, setShuffle] = useState(() => localStorage.getItem('shuffle') === 'true');
  const [repeat, setRepeat] = useState(() => localStorage.getItem('repeat') || 'none');
  const [crossfadeEnabled, setCrossfadeEnabled] = useState(() => localStorage.getItem('crossfadeEnabled') === 'true');
  const howlRef = useRef(null);

  useEffect(() => {
    if (currentFile && fileMapRef.current.has(currentFile.id)) {
      const file = fileMapRef.current.get(currentFile.id);
      const audioSrc = URL.createObjectURL(file);
      howlRef.current = new Howl({
        src: [audioSrc],
        format: ['mp3', 'wav', 'aac', 'flac', 'ogg'],
        html5: true,
        onload: () => {
          setDuration(howlRef.current.duration());
          if (isPlaying) howlRef.current.play();
        },
        onloaderror: (id, error) => {
          toast.error(`Failed to load audio: ${error}`);
        },
        onend: handleTrackEnd,
      });

      return () => {
        howlRef.current?.unload();
        URL.revokeObjectURL(audioSrc);
      };
    }
  }, [currentFile, fileMapRef]);

  useEffect(() => {
    if (!howlRef.current) return;
    const updateProgress = () => {
      if (howlRef.current.duration()) {
        setProgress(howlRef.current.seek() / howlRef.current.duration());
      }
    };
    howlRef.current.on('play', updateProgress);
    howlRef.current.on('timeupdate', updateProgress); // Note: Howler may not support 'timeupdate' natively
    return () => {
      howlRef.current.off('play', updateProgress);
      howlRef.current.off('timeupdate', updateProgress);
    };
  }, [currentFile]);

  useEffect(() => {
    if (howlRef.current) {
      howlRef.current.volume(isMuted ? 0 : volume);
    }
    localStorage.setItem('volume', volume);
    localStorage.setItem('isMuted', isMuted);
  }, [volume, isMuted]);

  const handlePlayPause = () => {
    if (!howlRef.current) return;
    if (isPlaying) {
      howlRef.current.pause();
    } else {
      howlRef.current.play().catch((err) => {
        toast.error('Playback error: ' + err.message);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleNextTrack = async () => {
    if (!queue.length || !currentFile) return;
    let nextIndex = queue.findIndex((song) => song.id === currentFile.id);

    if (shuffle && queue.length > 1) {
      do {
        nextIndex = Math.floor(Math.random() * queue.length);
      } while (nextIndex === queue.findIndex((song) => song.id === currentFile.id));
    } else {
      nextIndex = nextIndex < queue.length - 1 ? nextIndex + 1 : 0;
    }

    const nextSong = queue[nextIndex];
    if (nextSong) {
      const nextFile = fileMapRef.current.get(nextSong.id);
      if (!nextFile) {
        toast.error('Next song file not found.');
        return;
      }
      const nextAudioSrc = URL.createObjectURL(nextFile);
      const nextHowl = new Howl({
        src: [nextAudioSrc],
        format: ['mp3', 'wav', 'aac', 'flac', 'ogg'],
        html5: true,
      });
      if (crossfadeEnabled) {
        applyCrossfade(howlRef.current, nextHowl, () => {
          howlRef.current?.unload();
          howlRef.current = nextHowl;
          selectSong(nextSong.id);
          nextHowl.play();
        }, 2000);
      } else {
        howlRef.current?.stop();
        howlRef.current?.unload();
        howlRef.current = nextHowl;
        selectSong(nextSong.id);
        nextHowl.play();
      }
      setIsPlaying(true);
    }
  };

  const handlePreviousTrack = async () => {
    if (!queue.length || !currentFile) return;
    let prevIndex = queue.findIndex((song) => song.id === currentFile.id);
    prevIndex = prevIndex > 0 ? prevIndex - 1 : queue.length - 1;
    const prevSong = queue[prevIndex];
    if (prevSong) {
      selectSong(prevSong.id);
      if (howlRef.current) howlRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (newProgress) => {
    if (howlRef.current && duration) {
      const newTime = newProgress * duration;
      howlRef.current.seek(newTime);
    }
  };

  const handleTrackEnd = () => {
    if (repeat === 'all' && queue.length > 1) {
      handleNextTrack();
    } else if (repeat === 'one') {
      howlRef.current.seek(0);
      howlRef.current.play();
    } else {
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('shuffle', shuffle);
    localStorage.setItem('repeat', repeat);
    localStorage.setItem('crossfadeEnabled', crossfadeEnabled);
  }, [shuffle, repeat, crossfadeEnabled]);

  return {
    audioRef: howlRef, // Return howlRef as audioRef for consistency
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
  };
}