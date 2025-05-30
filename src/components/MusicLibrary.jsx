import { useState, useEffect } from 'react';
import { getSongs } from '../lib/indexedDB';

function MusicLibrary({ onSongSelect }) {
  const [songs, setSongs] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadSongs() {
      try {
        const songList = await getSongs();
        setSongs(songList);
      } catch (err) {
        console.error('Error loading songs:', err);
        setError('Failed to load music library.');
      }
    }
    loadSongs();
  }, []);

  return (
    <div className="p-4 bg-background text-text">
      <h2 className="text-2xl font-bold mb-4">Music Library</h2>
      {error && <p className="text-accent mb-4">{error}</p>}
      {songs.length === 0 ? (
        <p className="text-text">No songs found. Select a music folder.</p>
      ) : (
        <ul className="list-disc pl-5">
          {songs.map(song => (
            <li
              key={song.id}
              className="mb-2 cursor-pointer hover:text-primary"
              onClick={() => onSongSelect(song.file)}
            >
              {song.title} - {song.artist}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MusicLibrary;