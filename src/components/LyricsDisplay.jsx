import { useEffect, useState } from 'react';
import { getLyrics } from '../lib/audioUtil';

function LyricsDisplay({ songId, title, artist }) {
  const [lyrics, setLyrics] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchLyrics() {
      try {
        const data = await getLyrics(songId, title, artist);
        setLyrics(data || 'No lyrics available.');
        setError(null);
        return;
      } catch (err) {
        setError('Failed to load lyrics.');
        setLyrics('');
      }
    };
    fetchLyrics();
  }, [songId, title, artist]);

  return (
    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-h-32 sm:max-h-32 overflow-y-auto p-2 bg-background/50 dark:bg-gray-800/50/50 rounded">
      {error && <p className="text-accent">{error}</p>}
      {lyrics.split('\n').map((line, idx) => (
        <p key={idx} className="leading-relaxed">{line}</p>
      ))}
    </div>
  );
}

export default LyricsDisplay;