import { useState, useEffect } from 'react';
import MusicLibrary from './src/components/MusicLibrary';
import Player from './src/components/Player';
import Playlist from './src/components/Playlist';
import { selectMusicDirectory } from './lib/fileSystem';
import { extractMetadata, addSong } from './lib/indexedDB';
import index from 'index.css';

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

  useEffect(() => {
    console.log('App.jsx mounted successfully');
  }, []);

  return (
    <div className="min-h-screen bg-background text-text">
      <header className="p-4 bg-primary text-white">
        <h1 className="text-3xl font-bold">Offline Music Player</h1>
      </header>
      <main className="flex flex-col md:flex-row gap-4 p-4">
        <div className="flex-1">
          <button
            onClick={handleSelectDirectory}
            className="mb-4 bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded"
            aria-label="Select music folder"
          >
            Select Music Folder
          </button>
          {error && (
            <p className="text-accent mb-4" role="alert">
              {error}
            </p>
          )}
          <MusicLibrary />
        </div>
        <div className="flex-1">
          <Player file={currentFile} />
          <Playlist />
        </div>
      </main>
    </div>
  );
}

export default App;