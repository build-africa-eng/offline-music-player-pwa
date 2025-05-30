import { useState, useEffect } from 'react';
import MusicLibrary from './components/MusicLibrary';
import Player from './components/Player';
import Playlist from './components/Playlist';
import { selectMusicDirectory } from './lib/fileSystem';
import { addSong } from './lib/indexedDB';
import { extractMetadata } from './lib/metadata';
import './index.css';

function App() {
  const [currentFile, setCurrentFile] = useState(null);
  const [error, setError] = useState(null);

  const handleSelectDirectory = async () => {
    try {
      setError(null);
      const result = await selectMusicDirectory();
      if (!result) {
        setError('No directory selected or access denied.');
        return;
      }
      const { files } = result;
      for (const { file } of files) {
        const metadata = await extractMetadata(file);
        await addSong({ ...metadata, file });
      }
    } catch (err) {
      console.error('Error selecting directory:', err);
      setError('Failed to load music files. Please try again.');
    }
  };

  const handleSongSelect = (file) => {
    setCurrentFile(file);
  };

  useEffect(() => {
    console.log('App.jsx mounted successfully');
  }, []);

  return (
    <div className="min-h-screen bg-background text-text font-sans">
      <header className="p-4 bg-primary text-white shadow">
        <h1 className="text-3xl font-bold">Offline Music Player</h1>
      </header>
      <main className="p-4 max-w-7xl mx-auto">
        <div className="flex mb-4">
          <button
            onClick={() => setView('library')}
            className={`px-4 py-2 ${view === 'library' ? 'bg-primary text-white' : 'bg-background text-text'} rounded-lg mr-2`}
          >
            Library
          </button>
          <button
            onClick={() => setView('playlists')}
            className={`px-4 py-2 ${view === 'playlists' ? 'bg-primary text-white' : 'bg-background text-text'} rounded-lg`}
          >
            Playlists
          </button>
        </div>
        {view === 'library' && (
          <div className="flex-1">
            <button
              onClick={handleSelectDirectory}
              className="mb-4 bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded-lg transition-colors"
              aria-label="Select music folder"
            >
              Select Music Folder
            </button>
            {error && (
              <p className="text-accent mb-4" role="alert">
                {error}
              </p>
            )}
            <MusicLibrary onSongSelect={handleSongSelect} />
          </div>
        )}
        {view === 'playlists' && (
          <div className="flex-1">
            <Player file={currentFile} />
            <Playlist onSongSelect={handleSongSelect} />
          </div>
        )}
      </main>
    </div>
  );
}