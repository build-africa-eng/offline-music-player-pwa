import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { Howl } from 'howler';
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
  const howlRef = useRef(null);

  // Sync audio element with current file
  useEffect(() => {
    if (currentFile && fileMapRef.current.has(currentFile.id)) {
      const file = fileMapRef.current.get(currentFile.id);
      const audioSrc = URL.createObjectURL(file);
      howlRef.current = new Howl({
        src: [audioSrc],
        format: ['mp3', 'wav', 'aac', 'flac', 'ogg'], // Specify supported formats
        html5: true, // Use HTML5 Audio for better browser compatibility
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

  // Update progress
  useEffect(() => {
    if (!howlRef.current) return;
    const updateProgress = () => {
      setProgress(howlRef.current.seek() / howlRef.current.duration());
    };
    howlRef.current.on('play', updateProgress);
    howlRef.current.on('timeupdate', updateProgress);
    return () => {
      howlRef.current.off('play', updateProgress);
      howlRef.current.off('timeupdate', updateProgress);
    };
  }, [currentFile]);

  // Handle volume and mute
  useEffect(() => {
    if (howlRef.current) {
      howlRef.current.volume(isMuted ? 0 : volume);
    }
    localStorage.setItem('volume', volume);
    localStorage.setItem('isMuted', isMuted);
  }, [volume, isMuted]);

  // Playback controls
  const handlePlayPause = () => {
    if (!howlRef.current) return;
    if (isPlaying) {
      howlRef.current.pause();
      setIsPlaying(false);
    } else {
      howlRef.current.play().catch((err) => {
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
        const nextAudioSrc = URL.createObjectURL(nextFile);
        const nextHowl = new Howl({
          src: [nextAudioSrc],
          format: ['mp3', 'wav', 'aac', 'flac', 'ogg'],
          html5: true,
          onload: () => {
            if (crossfadeEnabled) {
              applyCrossfade(howlRef.current, nextHowl, () => {
                howlRef.current = nextHowl;
                selectSong(nextSong.id);
                setIsPlaying(true);
              }, 2000);
            } else {
              howlRef.current?.stop();
              howlRef.current = nextHowl;
              selectSong(nextSong.id);
              nextHowl.play();
              setIsPlaying(true);
            }
          },
          onloaderror: (id, error) => {
            toast.error(`Failed to load next song: ${error}`);
          },
        });
      } catch (err) {
        console.error('Crossfade error:', err);
        toast.error('Failed to play next song.');
      }
    }
  };

  const handlePreviousTrack = async () => {
    // Similar logic to handleNextTrack, adjusted for previous track
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
        const prevAudioSrc = URL.createObjectURL(prevFile);
        const prevHowl = new Howl({
          src: [prevAudioSrc],
          format: ['mp3', 'wav', 'aac', 'flac', 'ogg'],
          html5: true,
          onload: () => {
            if (crossfadeEnabled) {
              applyCrossfade(howlRef.current, prevHowl, () => {
                howlRef.current = prevHowl;
                selectSong(prevSong.id);
                setIsPlaying(true);
              }, 2000);
            } else {
              howlRef.current?.stop();
              howlRef.current = prevHowl;
              selectSong(prevSong.id);
              prevHowl.play();
              setIsPlaying(true);
            }
          },
          onloaderror: (id, error) => {
            toast.error(`Failed to load previous song: ${error}`);
          },
        });
      } catch (err) {
        console.error('Crossfade error:', err);
        toast.error('Failed to play previous song.');
      }
    }
  };

  const handleTrackEnd = () => {
    if (repeat === 'one') {
      howlRef.current?.seek(0);
      howlRef.current?.play();
      setIsPlaying(true);
    } else if (repeat === 'all' || queue.length > 1) {
      handleNextTrack();
    } else {
      setIsPlaying(false);
    }
  };

  const handleSeek = (newProgress) => {
    if (howlRef.current) {
      const newTime = newProgress * howlRef.current.duration();
      howlRef.current.seek(newTime);
      setProgress(newProgress);
    }
  };

  return {
    audioRef: howlRef, // Note: Renamed to match ref usage
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