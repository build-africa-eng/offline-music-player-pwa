import { useState, useEffect } from 'react';
import MusicLibrary from './components/MusicLibrary';
import Player from './components/Player';
import Playlist from './components/Playlist';
import { selectMusicDirectory } from './lib/fileSystem';
import { addSong } from './lib/indexedDB';
import { extractMetadata } from './lib/metadata';

function App() {
  const [currentFile, setCurrentFile] = useState(null);
  const [error, setError] = useState(null);
  const [view, setView] = useState('library');

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

  const handleSongSelect = async (file) => {
    try {
      setError(null);
      const metadata = await extractMetadata(file);
      await addSong({ ...metadata, file });
      setCurrentFile(file);
    } catch (err) {
      console.error('Error selecting song:', err);
      setError('Failed to play song.');
    }
  };

  useEffect(() => {
    console.log('App.jsx mounted successfully');
  }, []);

  return (
    <div className="min-h-screen bg-background text-text font-sans">
      <header className="p-3 sm:p-4 bg-primary text-white shadow">
        <h1 className="text-2xl sm:text-3xl font-bold">Offline Music Player</h1>
      </header>
      <main className="p-3 sm:p-4 max-w-4xl mx-auto">
        <Player file={currentFile} onFileSelect={handleSongSelect} />
        <div className="flex mb-3 sm:mb-4 space-x-2 overflow-x-auto">
          <button
            onClick={() => setView('library')}
            className={`px-3 sm:px-4 py-1 sm:py-2 rounded-lg text-sm sm:text-base transition-colors ${view === 'library' ? 'bg-primary text-white' : 'bg-background text-text hover:bg-secondary hover:text-white'}`}
          >
            Library
          </button>
          <button
            onClick={() => setView('playlists')}
            className={`px-3 sm:px-4 py-1 sm:py-2 rounded-lg text-sm sm:text-base transition-colors ${view === 'playlists' ? 'bg-primary text-white' : 'bg-background text-text hover:bg-secondary hover:text-white'}`}
          >
            Playlists
          </button>
        </div>
        {view === 'library' && (
          <div className="flex-1">
            <button
              onClick={handleSelectDirectory}
              className="mb-3 sm:mb-4 bg-primary hover:bg-secondary text-white text-sm sm:text-base font-bold py-2 px-3 sm:px-4 rounded-lg transition-colors"
              aria-label="Select music folder"
            >
              Select Music Folder
            </button>
            {error && (
              <p className="text-accent mb-3 sm:mb-4 text-xs sm:text-sm" role="alert">
                {error}
              </p>
            )}
            <MusicLibrary onSongSelect={handleSongSelect} />
          </div>
        )}
        {view === 'playlists' && (
          <div className="flex-1">
            <Playlist onSongSelect={handleSongSelect} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;