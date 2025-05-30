import { useState, useEffect } from 'react';
import { getPlaylists, addPlaylist, deletePlaylist, updatePlaylist, getSongById } from '../lib/indexedDB';

function Playlist({ onSongSelect }) {
  const [playlists, setPlaylists] = useState([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [playlistSongs, setPlaylistSongs] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadPlaylists() {
      try {
        const playlistList = await getPlaylists();
        setPlaylists(playlistList);
      } catch (err) {
        console.error('Error loading playlists:', err);
        setError('Failed to load playlists.');
      }
    }
    loadPlaylists();
  }, []);

  useEffect(() => {
    async function loadPlaylistSongs() {
      if (!selectedPlaylistId) {
        setPlaylistSongs([]);
        return;
      }
      try {
        const playlist = playlists.find(p => p.id === selectedPlaylistId);
        if (playlist) {
          const songs = await Promise.all(
            playlist.songIds.map(async id => await getSongById(id))
          );
          setPlaylistSongs(songs.filter(song => song));
        }
      } catch (err) {
        console.error('Error loading playlist songs:', err);
        setError('Failed to load playlist songs.');
      }
    }
    loadPlaylistSongs();
  }, [selectedPlaylistId, playlists]);

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) {
      setError('Playlist name is required.');
      return;
    }
    try {
      setError(null);
      await addPlaylist({ name: newPlaylistName.trim() });
      setNewPlaylistName('');
      const updatedPlaylists = await getPlaylists();
      setPlaylists(updatedPlaylists);
    } catch (err) {
      console.error('Error creating playlist:', err);
      setError('Failed to create playlist.');
    }
  };

  const handleDeletePlaylist = async (id) => {
    try {
      setError(null);
      await deletePlaylist(id);
      setPlaylists(playlists.filter(p => p.id !== id));
      if (selectedPlaylistId === id) setSelectedPlaylistId(null);
    } catch (err) {
      console.error('Error deleting playlist:', err);
      setError('Failed to delete playlist.');
    }
  };

  const handleRemoveSong = async (songId) => {
    try {
      setError(null);
      const playlist = playlists.find(p => p.id === selectedPlaylistId);
      if (playlist) {
        playlist.songIds = playlist.songIds.filter(id => id !== songId);
        await updatePlaylist(playlist);
        setPlaylists(playlists.map(p => p.id === playlist.id ? playlist : p));
        setPlaylistSongs(playlistSongs.filter(song => song.id !== songId));
      }
    } catch (err) {
      console.error('Error removing song from playlist:', err);
      setError('Failed to remove song.');
    }
  };

  return (
    <div className="p-4 bg-background text-text rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Playlists</h2>
      {error && <p className="text-accent mb-4" role="alert">{error}</p>}
      
      <form onSubmit={handleCreatePlaylist} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            placeholder="New playlist name"
            className="flex-1 p-2 border border-gray-300 rounded text-text bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Create
          </button>
        </div>
      </form>

      <div className="mb-6">
        {playlists.length === 0 ? (
          <p className="text-text">No playlists yet. Create one above!</p>
        ) : (
          <ul className="space-y-2">
            {playlists.map(playlist => (
              <li key={playlist.id} className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedPlaylistId(playlist.id)}
                  className={`text-left flex-1 p-2 rounded hover:bg-primary hover:text-white transition-colors ${selectedPlaylistId === playlist.id ? 'bg-primary text-white' : ''}`}
                >
                  {playlist.name} ({playlist.songIds.length} songs)
                </button>
                <button
                  onClick={() => handleDeletePlaylist(playlist.id)}
                  className="ml-2 text-accent hover:text-red-700 transition-colors"
                  aria-label={`Delete ${playlist.name}`}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedPlaylistId && (
        <div>
          <h3 className="text-lg font-semibold mb-2">
            {playlists.find(p => p.id === selectedPlaylistId)?.name}
          </h3>
          {playlistSongs.length === 0 ? (
            <p className="text-text">No songs in this playlist. Add from Music Library.</p>
          ) : (
            <ul className="list-disc pl-5 space-y-2">
              {playlistSongs.map(song => (
                <li key={song.id} className="flex items-center justify-between">
                  <button
                    onClick={() => onSongSelect(song.file)}
                    className="text-left flex-1 hover:text-primary transition-colors"
                  >
                    {song.title} - {song.artist}
                  </button>
                  <button
                    onClick={() => handleRemoveSong(song.id)}
                    className="ml-2 text-accent hover:text-red-700 transition-colors"
                    aria-label={`Remove ${song.title} from playlist`}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default Playlist;