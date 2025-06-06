import { useState, useEffect, useRef } from 'react';
import { useMusic } from '../context/MusicContext';
import Lyric from 'lyric-parser';

const LyricsDisplay = ({ songId }) => {
  const { getLyrics } = useMusic();
  const [lyrics, setLyrics] = useState(null);
  const [currentLyric, setCurrentLyric] = useState('');
  const lyricsRef = useRef(null);

  useEffect(() => {
    const loadLyrics = async () => {
      const lyricText = await getLyrics(songId);
      if (lyricText) {
        const lyricParser = new Lyric(lyricText, ({ line }) => {
          setCurrentLyric(line.lyric);
          if (lyricsRef.current) {
            const activeLyric = lyricsRef.current.querySelector('.text-primary');
            if (activeLyric) {
              activeLyric.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        });
        setLyrics(lyricParser);
      } else {
        setLyrics(null);
        setCurrentLyric('');
      }
    };

    loadLyrics();

    return () => {
      if (lyrics) {
        lyrics.stop();
      }
    };
  }, [songId, getLyrics]);

  // Placeholder for external sync (e.g., from Player.jsx)
  useEffect(() => {
    // This effect would be called by Player.jsx to sync with progress
    // For now, assume it’s managed externally
  }, []);

  if (!lyrics) return null;

  return (
    <div
      ref={lyricsRef}
      className="max-w-2xl w-full h-40 overflow-y-auto bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center"
    >
      {lyrics.lines.map((line, index) => (
        <p
          key={index}
          className={`${
            currentLyric === line.lyric ? 'text-primary font-semibold' : 'text-gray-600 dark:text-gray-300'
          } transition-colors duration-200`}
        >
          {line.lyric}
        </p>
      ))}
    </div>
  );
};

export default LyricsDisplay;