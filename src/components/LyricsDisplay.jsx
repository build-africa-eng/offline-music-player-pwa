import { useEffect, useState, useRef } from 'react';
import { getLyrics } from '../lib/audio';
import { useMusic } from '../context/MusicContext';

function LyricsDisplay({ songId, title, artist }) {
  const { currentFile } = useMusic();
  const [lyrics, setLyrics] = useState([]);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const lyricsRef = useRef(null);

  useEffect(() => {
    let timeout;
    async function fetchLyrics() {
      try {
        const data = await getLyrics(songId, title, artist);
        const parsed = parseLRC(data);
        setLyrics(parsed);
        setError(null);
      } catch (err) {
        setError('Failed to load lyrics.');
        setLyrics([]);
        timeout = setTimeout(fetchLyrics, 5000); // Retry after 5s
      }
    }
    fetchLyrics();
    return () => clearTimeout(timeout);
  }, [songId, title, artist]);

  useEffect(() => {
    const audio = document.querySelector('audio');
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    audio.addEventListener('timeupdate', updateTime);
    return () => audio.removeEventListener('timeupdate', updateTime);
  }, [currentFile]);

  useEffect(() => {
    const currentLine = lyrics.find((line, idx) => {
      const nextTime = lyrics[idx + 1]?.time || Infinity;
      return currentTime >= line.time && currentTime < nextTime;
    });
    if (currentLine && lyricsRef.current) {
      const el = lyricsRef.current.querySelector(`[data-time="${currentLine.time}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentTime, lyrics]);

  function parseLRC(text) {
    const lines = text.split('\n').map(line => {
      const match = line.match(/\[(\d+):(\d+\.\d+)\](.*)/);
      if (!match) return { time: 0, text: line };
      const [, min, sec, textLine] = match;
      return { time: parseInt(min) * 60 + parseFloat(sec), text: textLine.trim() };
    });
    return lines.filter(line => line.text);
  }

  return (
    <div
      ref={lyricsRef}
      className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-h-24 sm:max-h-32 overflow-y-auto p-2 bg-background/50 dark:bg-gray-800/50 rounded"
    >
      {error && <p className="text-accent">{error}</p>}
      {lyrics.length === 0 && !error && <p className="italic text-gray-500 dark:text-gray-400">Loading lyrics...</p>}
      {lyrics.map((line, idx) => (
        <p
          key={idx}
          data-time={line.time}
          className={`leading-relaxed ${currentTime >= line.time && currentTime < (lyrics[idx + 1]?.time || Infinity) ? 'text-primary font-semibold' : ''}`}
        >
          {line.text}
        </p>
      ))}
    </div>
  );
}

export default LyricsDisplay;