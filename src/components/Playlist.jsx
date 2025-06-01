import { useState, useEffect } from 'react';
import { useMusic } from '../context/MusicContext';
import { addPlaylist, deletePlaylist, updatePlaylist, getSongById } from '../lib/indexedDB';

function Playlist() {
  const { playlists, error, handlePlaylistSongSelect } = useMusic();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [playlistSongs, setPlaylistSongs] = useState([]);

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
      }
    }
    loadPlaylistSongs();
  }, [selectedPlaylistId, playlists]);

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    const trimmedName = newPlaylistName.trim();
    if (!trimmedName) {
      return;
    }
    if (playlists.some(p => p.name === trimmedName)) {
      return;
    }
    try {
      await addPlaylist({ name: trimmedName });
      setNewPlaylistName('');
    } catch (err) {
      console.error('Error creating playlist:', err);
    }
  };

  const handleDeletePlaylist = async (id) => {
    try {
      await deletePlaylist(id);
      if (selectedPlaylistId === id) setSelectedPlaylistId(null);
    } catch (err) {
      console.error('Error deleting playlist:', err);
    }
  };

  const handleRemoveSong = async (songId) => {
    try {
      const playlist = playlists.find(p => p.id === selectedPlaylistId);
      if (playlist) {
        playlist.songIds = playlist.songIds.filter(id => id !== songId);
        await updatePlaylist(playlist);
        setPlaylistSongs(playlistSongs.filter(song => song.id !== songId));
      }
    } catch (err) {
      console.error('Error removing song from playlist:', err);
    }
  };

  const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId);

  return (
    <div className="p-3 sm:p-4 bg-background/80 text-text rounded-lg shadow-md backdrop-blur-sm">
      <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Playlists</h2>
      {error && <p className="text-accent mb-3 sm:mb-4 text-xs sm:text-sm" role="alert">{error}</p>}
      
      <form onSubmit={handleCreatePlaylist} className="mb-4 sm:mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            placeholder="New playlist name"
            className="flex-1 p-2 text-xs sm:text-sm border border-gray-300 rounded bg-background/80 text-text focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            className="bg-primary hover:bg-secondary text-white font-bold py-2 px-3 sm:px-4 rounded-lg text-xs sm:text-sm transition-colors"
          >
            Create
          </button>
        </div>
      </form>

      <div className="mb-4 sm:mb-6">
        {playlists.length === 0 ? (
          <p className="text-text text-xs sm:text-sm">No playlists yet. Create one above!</p>
        ) : (
          <ul className="space-y-2">
            {playlists.map(playlist => (
              <li key={playlist.id} className="flex items-center justify-between flex-wrap gap-2">
                <button
                  onClick={() => setSelectedPlaylistId(playlist.id)}
                  className={`text-left flex-1 p-2 rounded hover:bg-primary hover:text-white transition-colors text-sm sm:text-base ${selectedPlaylistId === playlist.id ? 'bg-primary text-white' : ''}`}
                >
                  {playlist.name} ({playlist.songIds.length} songs)
                </button>
                <button
                  onClick={() => handleDeletePlaylist(playlist.id)}
                  className="text-accent hover:text-red-700 transition-colors text-xs sm:text-sm"
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
          <h3 className="text-base sm:text-lg font-semibold mb-2">
            {selectedPlaylist?.name}
          </h3>
          {playlistSongs.length === 0 ? (
            <p className="text-text text-xs sm:text-sm">No songs in this playlist. Add from Music Library.</p>
          ) : (
            <ul className="space-y-2">
              {playlistSongs.map(song => (
                <li key={song.id} className="flex items-center justify-between flex-wrap gap-2">
                  <button
                    onClick={() => handlePlaylistSongSelect(song.id)}
                    className="text-left flex-1 hover:text-primary transition-colors text-sm sm:text-base py-1"
                  >
                    {song.title} - {song.artist}
                  </button>
                  <button
                    onClick={() => handleRemoveSong(song.id)}
                    className="text-accent hover:text-red-700 transition-colors text-xs sm:text-sm"
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