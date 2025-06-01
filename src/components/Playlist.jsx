import { useState, useEffect } from 'react';
import { useMusic } from '../context/MusicContext';
import { addPlaylist, deletePlaylist, updatePlaylist, getSongById } from '../lib/indexedDB';
import { ListMusic, Trash2 } from 'lucide-react';

function Playlist() {
  const { playlists, error, selectSong } = useMusic();
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
        const playlist = playlists.find((p) => p.id === selectedPlaylistId);
        if (playlist) {
          const songs = await Promise.all(playlist.songIds.map(async (id) => await getSongById(id)));
          setPlaylistSongs(songs.filter((song) => song));
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
    if (!trimmedName || playlists.some((p) => p.name === trimmedName)) return;
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
      const playlist = playlists.find((p) => p.id === selectedPlaylistId);
      if (playlist) {
        playlist.songIds = playlist.songIds.filter((id) => id !== songId);
        await updatePlaylist(playlist);
        setPlaylistSongs(playlistSongs.filter((song) => song.id !== songId));
      }
    } catch (err) {
      console.error('Error removing song from playlist:', err);
    }
  };

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId);

  return (
    <div className="p-4 bg-gray-800/80 text-white rounded-lg shadow-md backdrop-blur-sm">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <ListMusic className="w-6 h-6" /> Playlists
      </h2>
      {error && <p className="text-red-400 mb-4">{error}</p>}
      <form onSubmit={handleCreatePlaylist} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            placeholder="New playlist name"
            className="flex-1 p-2 border border-gray-300 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#1db954]"
          />
          <button
            type="submit"
            className="bg-[#1db954] hover:bg-[#1ed760] text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Create
          </button>
        </div>
      </form>
      <div className="mb-6">
        {playlists.length === 0 ? (
          <p>No playlists yet. Create one above!</p>
        ) : (
          <ul className="space-y-2">
            {playlists.map((playlist) => (
              <li key={playlist.id} className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedPlaylistId(playlist.id)}
                  className={`text-left flex-1 p-2 rounded hover:bg-[#1db954] hover:text-white transition-colors ${
                    selectedPlaylistId === playlist.id ? 'bg-[#1db954] text-white' : ''
                  }`}
                >
                  {playlist.name} ({playlist.songIds.length} songs)
                </button>
                <button
                  onClick={() => handleDeletePlaylist(playlist.id)}
                  className="text-red-400 hover:text-red-600 transition-colors"
                  aria-label="Delete playlist"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {selectedPlaylistId && (
        <div>
          <h3 className="text-lg font-semibold mb-2">{selectedPlaylist?.name}</h3>
          {playlistSongs.length === 0 ? (
            <p>No songs in this playlist. Add from Music Library.</p>
          ) : (
            <ul className="space-y-2">
              {playlistSongs.map((song) => (
                <li key={song.id} className="flex items-center justify-between">
                  <button
                    onClick={() => selectSong(song.id)}
                    className="text-left flex-1 hover:text-[#1db954] transition-colors py-1"
                  >
                    {song.title} - {song.artist}
                  </button>
                  <button
                    onClick={() => handleRemoveSong(song.id)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                    aria-label="Remove song"
                  >
                    <Trash2 className="w-4 h-4" />
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