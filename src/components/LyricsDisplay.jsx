import { useState, useEffect, useRef } from 'react';
import { useMusic } from '../context/MusicContext';
import Lyric from 'lyric-parser';

const LyricsDisplay = ({ songId, progress, isPlaying }) => {
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

  useEffect(() => {
    if (lyrics && isPlaying) {
      lyrics.seek(progress * 1000);
      lyrics.play();
    } else if (lyrics && !isPlaying) {
      lyrics.stop();
    }
  }, [progress, isPlaying, lyrics]);

  if (!lyrics) return null;

  return (
    <div
      ref={lyricsRef}
      className="lyrics-container"
      aria-live="polite"
      aria-label="Lyrics display"
    >
      {lyrics.lines.map((line, index) => (
        <p
          key={index}
          className={`${
            currentLyric === line.lyric ? 'text-primary' : 'text-gray-600 dark:text-gray-300'
          } transition-colors duration-200`}
        >
          {line.lyric}
        </p>
      ))}
    </div>
  );
};

export default LyricsDisplay;