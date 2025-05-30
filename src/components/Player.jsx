import { useEffect, useRef, useState } from 'react';

function Player({ file }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [objectUrl, setObjectUrl] = useState(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setObjectUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [file]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play();
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
      setDuration(audio.duration);
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = e.target.value;
    }
  };

  const handleVolumeChange = (e) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  return (
    <div className="p-4 bg-card text-text rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-2">Now Playing</h2>
      {file ? (
        <>
          <audio
            ref={audioRef}
            src={objectUrl}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            autoPlay
          />
          <div className="mb-2 text-sm">
            <strong>{file.name}</strong>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handlePlayPause}
              className="bg-primary text-white px-3 py-1 rounded hover:bg-secondary transition"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>

            <input
              type="range"
              min="0"
              max={duration || 0}
              value={progress}
              onChange={handleSeek}
              className="flex-1"
            />

            <span className="text-xs w-16 text-right">
              {Math.floor(progress)} / {Math.floor(duration)}s
            </span>
          </div>

          <div className="mt-2">
            <label className="text-sm mr-2">Volume</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-32"
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