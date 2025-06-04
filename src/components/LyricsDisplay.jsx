import { useState, useEffect } from 'react';
import lrcParser from 'lrc-parser';

function LyricsDisplay({ songId, title, artist, progress }) {
  const [lyrics, setLyrics] = useState([]);
  const [currentLine, setCurrentLine] = useState('');

  useEffect(() => {
    const fetchLyrics = async () => {
      try {
        // Placeholder: Replace with actual lyrics fetching logic (e.g., from IndexedDB or API)
        const lrcData = `[00:01.00] Verse 1\n[00:05.00] Hello world\n[00:10.00] Chorus`;
        const parsed = lrcParser(lrcData);
        setLyrics(parsed.lyrics || []);
      } catch (err) {
        console.error('Lyrics fetch error:', err);
        setLyrics([]);
      }
    };
    fetchLyrics();
  }, [songId, title, artist]);

  useEffect(() => {
    if (!lyrics.length || !progress) return;
    const currentTime = progress * 1000; // Convert progress (0-1) to milliseconds
    const line = lyrics.find((l, i) => {
      const nextLine = lyrics[i + 1];
      return currentTime >= l.time && (!nextLine || currentTime < nextLine.time);
    });
    setCurrentLine(line ? line.text : '');
  }, [progress, lyrics]);

  return (
    <div className="w-full h-20 bg-gray-200 dark:bg-gray-700 rounded-lg p-3 overflow-y-auto text-center">
      <p className="text-base text-muted-foreground">{currentLine || 'No lyrics available'}</p>
    </div>
  );
}

export default LyricsDisplay;