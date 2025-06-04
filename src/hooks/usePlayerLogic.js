import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { applyCrossfade } from '../lib/audio';

export function usePlayerLogic({ queue, currentFile, fileMapRef, selectSong }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => parseFloat(localStorage.getItem('volume')) || 1);
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('isMuted') === 'true');
  const [shuffle, setShuffle] = useState(() => localStorage.getItem('shuffle') === 'true');
  const [repeat, setRepeat] = useState(() => localStorage.getItem('repeat') || 'none');
  const [crossfadeEnabled, setCrossfadeEnabled] = useState(() => localStorage.getItem('crossfadeEnabled') === 'true');
  const audioRef = useRef(new Audio());

  // Sync audio element with current file
  useEffect(() => {
    if (currentFile && fileMapRef.current.has(currentFile.id)) {
      const file = fileMapRef.current.get(currentFile.id);
      const audioSrc = URL.createObjectURL(file);
      audioRef.current.src = audioSrc;
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch((err) => {
          toast.error('Playback error: ' + err.message);
          setIsPlaying(false);
        });
      }

      return () => {
        audioRef.current.pause();
        URL.revokeObjectURL(audioSrc);
      };
    }
  }, [currentFile, fileMapRef]);

  // Update progress and duration
  useEffect(() => {
    const audio = audioRef.current;
    const updateProgress = () => {
      setProgress(audio.currentTime / audio.duration || 0);
      setDuration(audio.duration || 0);
    };
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateProgress);
    audio.addEventListener('ended', handleTrackEnd);
    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', updateProgress);
      audio.removeEventListener('ended', handleTrackEnd);
    };
  }, [currentFile]);

  // Handle volume and mute
  useEffect(() => {
    audioRef.current.volume = isMuted ? 0 : volume;
    localStorage.setItem('volume', volume);
    localStorage.setItem('isMuted', isMuted);
  }, [volume, isMuted]);

  // Playback controls
  const handlePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((err) => {
        toast.error('Playback error: ' + err.message);
      });
      setIsPlaying(true);
    }
  };

  const handleNextTrack = async () => {
    if (!queue.length || !currentFile) return;
    let nextIndex;
    const currentIndex = queue.findIndex((song) => song.id === currentFile.id);

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
        if (crossfadeEnabled) {
          await applyCrossfade(audioRef.current, nextAudio, () => {
            audioRef.current = nextAudio;
            selectSong(nextSong.id);
          }, 2000);
        } else {
          audioRef.current.pause();
          audioRef.current = nextAudio;
          selectSong(nextSong.id);
          nextAudio.play();
        }
        setIsPlaying(true);
      } catch (err) {
        console.error('Crossfade error:', err);
        toast.error('Failed to play next song.');
      }
    }
  };

  const handlePreviousTrack = async () => {
    if (!queue.length || !currentFile) return;
    let prevIndex;
    const currentIndex = queue.findIndex((song) => song.id === currentFile.id);

    if (shuffle && queue.length > 1) {
      do {
        prevIndex = Math.floor(Math.random() * queue.length);
      } while (prevIndex === currentIndex);
    } else {
      prevIndex = currentIndex > 0 ? currentIndex - 1 : queue.length - 1;
    }

    const prevSong = queue[prevIndex];
    if (prevSong) {
      const prevFile = fileMapRef.current.get(prevSong.id);
      if (!prevFile) {
        toast.error('Previous song file not found.');
        return;
      }
      try {
        const prevAudio = new Audio(URL.createObjectURL(prevFile));
        if (crossfadeEnabled) {
          await applyCrossfade(audioRef.current, prevAudio, () => {
            audioRef.current = prevAudio;
            selectSong(prevSong.id);
          }, 2000);
        } else {
          audioRef.current.pause();
          audioRef.current = prevAudio;
          selectSong(prevSong.id);
          prevAudio.play();
        }
        setIsPlaying(true);
      } catch (err) {
        console.error('Crossfade error:', err);
        toast.error('Failed to play previous song.');
      }
    }
  };

  const handleTrackEnd = () => {
    if (repeat === 'one') {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    } else if (repeat === 'all' || queue.length > 1) {
      handleNextTrack();
    } else {
      setIsPlaying(false);
    }
  };

  const handleSeek = (newProgress) => {
    const audio = audioRef.current;
    audio.currentTime = newProgress * audio.duration;
    setProgress(newProgress);
  };

  return {
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
  };
}