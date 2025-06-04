import { useState, useEffect } from 'react';
import lrcParser from 'lrc-parser';

function LyricsDisplay({ songId, title, artist, progress }) {
  const [lyrics, setCurrentLyrics] = useState([]);
  const [currentLine, setCurrentLine] = useState('');

  useEffect(() => {
    // Placeholder: Fetch lyrics (e.g., from IndexedDB or API)
    const fetchLyrics = async () => {
      try {
        // Mock LRC data (replace with actual fetch)
        const lrcData = `[00:01.00] Verse 1\n[00:05.00] Hello world\n[00:10.00] Chorus`;
        const parsed = await lrcParser(lrcData);
        setLyrics(parsed.lyrics);
      } catch (err) {
        console.error('Lyrics fetch error:', err);
      }
    };

    fetchLyrics();
  }, [songId, title, artist]);

  useEffect(() => {
    if (!lyrics.length || !progress) return;

    const currentTime = progress * 1000; // Convert to milliseconds
    const line = lyrics.find((l, i) => {
      const nextLine = lyrics[i + 1];
      return currentTime >= l.time && (!nextLine || currentTime < nextLine.time);
    });
    setCurrentLine(line ? line.text : '');
  }, [progress, lyrics]);

  return (
    <div className="w-full h-20 bg-gray-200 rounded-lg p-3 overflow-y-auto text-center      <p className="text-base text-muted-foreground">{currentLine || 'No lyrics available'}</p>
    </div>
  );
}

export default LyricsDisplay;