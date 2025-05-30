import { useEffect, useState } from 'react';
import { getSongs } from '../lib/indexedDB';
function MusicLibrary() {
  const [songs, setSongs] = useState([]);
  useEffect(() => {
    async function loadSongs() {
      const songList = await getSongs();
      setSongs(songList);
    }
    loadSongs();
  }, []);
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Music Library</h2>
      <ul className="list-disc pl-5">
        {songs.map(song => (
          <li key={song.id} className="mb-2">
            {song.title} - {song.artist}
          </li>
        ))}
      </ul>
    </div>
  );
}
export default MusicLibrary;
