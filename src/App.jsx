import { useState } from 'react';
import MusicLibrary from './components/MusicLibrary';
import Player from './components/Player';
import Playlist from './components/Playlist';
import { selectMusicDirectory } from './lib/fileSystem';
import { extractMetadata, addSong } from './lib/indexedDB';
function App() {
  const [currentFile, setCurrentFile] = useState(null);
  const handleSelectDirectory = async () => {
    const { files } = await selectMusicDirectory();
    if (files) {
      for (const { file } of files) {
        const metadata = await extractMetadata(file);
        await addSong({ ...metadata, file });
      }
    }
  };
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="p-4 bg-blue-600 text-white">
        <h1 className="text-3xl font-bold">Offline Music Player</h1>
      </header>
      <main className="flex flex-col md:flex-row gap-4 p-4">
        <div className="flex-1">
          <button
            onClick={handleSelectDirectory}
            className="mb-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Select Music Folder
          </button>
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
