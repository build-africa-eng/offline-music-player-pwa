import { useState, useEffect } from 'react';
import { getSongs, getPlaylists, updatePlaylist } from '../lib/indexedDB';

function MusicLibrary({ onSongSelect }) {
  const [songs, setSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [error, setError] = useState(null);
  const [addToPlaylistSongId, setAddToPlaylistSongId] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [songList, playlistList] = await Promise.all([getSongs(), getPlaylists()]);
        setSongs(songList);
        setPlaylists(playlistList);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load music library or playlists.');
      }
    }
    loadData();
  }, []);

  const handleAddToPlaylist = async (playlistId, songId) => {
    try {
      setError(null);
      const playlist = playlists.find(p => p.id === playlistId);
      if (playlist && !playlist.songIds.includes(songId)) {
        playlist.songIds.push(songId);
        await updatePlaylist(playlist);
        setPlaylists(playlists.map(p => p.id === playlistId ? playlist : p));
      }
      setAddToPlaylistSongId(null);
    } catch (err) {
      console.error('Error adding song to playlist:', err);
      setError('Failed to add song to playlist.');
    }
  };

  return (
    <div className="p-4 bg-background text-text rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Music Library</h2>
      {error && <p className="text-accent mb-4">{error}</p>}
      {songs.length === 0 ? (
        <p className="text-text">No songs found. Select a music folder.</p>
      ) : (
        <ul className="list-disc pl-5 space-y-2">
          {songs.map(song => (
            <li key={song.id} className="flex items-center justify-between">
              <button
                onClick={() => onSongSelect(song.file)}
                className="text-left flex-1 hover:text-primary transition-colors"
              >
                {song.title} - {song.artist}
              </button>
              <button
                onClick={() => setAddToPlaylistSongId(addToPlaylistSongId === song.id ? null : song.id)}
                className="ml-2 bg-primary hover:bg-secondary text-white py-1 px-2 rounded text-sm transition-colors"
                aria-label={`Add ${song.title} to playlist`}
              >
                {addToPlaylistSongId === song.id ? 'Cancel' : 'Add to Playlist'}
              </button>
              {addToPlaylistSongId === song.id && (
                <div className="ml-2 flex flex-col gap-1">
                  {playlists.length === 0 ? (
                    <p className="text-text text-sm">No playlists available. Create one first.</p>
                  ) : (
                    playlists.map(playlist => (
                      <button
                        key={playlist.id}
                        onClick={() => handleAddToPlaylist(playlist.id, song.id)}
                        className="text-left text-sm text-primary hover:text-secondary transition-colors"
                      >
                        {playlist.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MusicLibrary;