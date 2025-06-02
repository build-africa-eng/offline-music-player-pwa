import { useEffect, useRef, useState } from 'react';

function SimplePlayer({ file }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (audioRef.current && file) {
      audioRef.current.load();
    }
  }, [file]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play().then(() => setIsPlaying(true));
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="p-4">
      <audio ref={audioRef} controls>
        <source src={file ? URL.createObjectURL(file) : ''} />
      </audio>
      <button onClick={togglePlay} className="mt-2 p-2 bg-blue-500 text-white rounded">
        {isPlaying ? 'Pause' : 'Play'}
      </button>
    </div>
  );
}

export default SimplePlayer;