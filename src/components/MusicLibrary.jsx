import { useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { FolderPlus, ListMusic, PlusCircle, Upload } from 'lucide-react';

function UploadComponent() {
  const { handleSelectDirectory } = useMusic();

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'audio/*';
    input.onchange = handleSelectDirectory;
    input.click();
  };

  return (
    <button
      onClick={handleUpload}
      className="bg-primary hover:bg-secondary text-white text-sm sm:text-base font-bold py-2 px-3 sm:px-4 rounded-lg transition-colors flex items-center gap-2"
      aria-label="Upload files"
    >
      <Upload className="w-4 h-4" /> Upload File
    </button>
  );
}

function MusicLibrary() {
  const { songs, error, playlists, handleSelectDirectory, selectSong, addSongToPlaylist } = useMusic();
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('');

  const handleSelectFolder = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;
    input.onchange = handleSelectDirectory;
    input.click();
  };

  const handleAddToPlaylist = (songId) => {
    if (selectedPlaylistId) {
      addSongToPlaylist(selectedPlaylistId, songId);
      setSelectedPlaylistId('');
    }
  };

  return (
    <div className="p-3 sm:p-4 bg-background/80 text-text rounded-lg shadow-md backdrop-blur-sm">
      <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
        <ListMusic className="w-6 h-6" /> Music Library
      </h2>
      {error && <p className="text-accent mb-3 sm:mb-4 text-xs sm:text-sm">{error}</p>}
      <div className="flex flex-col sm:flex-row gap-2 mb-3 sm:mb-4">
        <button
          onClick={handleSelectFolder}
          className="bg-primary hover:bg-secondary text-white text-sm sm:text-base font-bold py-2 px-3 sm:px-4 rounded-lg transition-colors flex items-center gap-2"
          aria-label="Select music folder"
        >
          <FolderPlus className="w-4 h-4" /> Select Music Folder
        </button>
        <UploadComponent />
        <button
          onClick={handleSelectFolder}
          className="bg-primary hover:bg-secondary text-white text-sm sm:text-base font-bold py-2 px-3 sm:px-4 rounded-lg transition-colors flex items-center gap-2"
          aria-label="Upload folder"
        >
          <FolderPlus className="w-4 h-4" /> Upload Folder
        </button>
      </div>
      <div className="mb-3 sm:mb-4">
        <label className="text-xs sm:text-sm mr-2">Add to playlist:</label>
        <select
          value={selectedPlaylistId}
          onChange={(e) => setSelectedPlaylistId(e.target.value)}
          className="p-1 text-xs sm:text-sm border border-gray-300 rounded bg-background/80 text-text focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Select...</option>
          {playlists.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      {songs.length === 0 ? (
        <p className="text-text text-xs sm:text-sm">No songs found. Select a music folder or upload files.</p>
      ) : (
        <ul className="space-y-2">
          {songs.map((song) => (
            <li key={song.id} className="flex items-center justify-between flex-wrap gap-2">
              <button
                onClick={() => selectSong(song.id)}
                className="text-left flex-1 hover:text-primary transition-colors text-sm sm:text-base py-1"
              >
                {song.title} - {song.artist}
              </button>
              <button
                onClick={() => handleAddToPlaylist(song.id)}
                className="bg-primary hover:bg-secondary text-white py-1 px-2 rounded text-xs sm:text-sm transition-colors disabled:opacity-50 flex items-center gap-1"
                aria-label={`Add ${song.title} to playlist`}
                disabled={!selectedPlaylistId}
              >
                <PlusCircle className="w-4 h-4" /> Add
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MusicLibrary;
