import React from 'react';
import { MusicProvider } from './context/MusicContext';
import MusicLibrary from './components/MusicLibrary';
import Player from './components/Player';

function App() {
  const { clearDatabase, error } = useMusic();

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <h1 className="text-2xl font-bold p-4">Offline Music Player</h1>
      <nav className="p-4">
        <a href="#music-library" className="mr-4">Library</a>
      </nav>
      {error && <div className="p-4 text-red-500">{error}</div>}
      <button
        onClick={clearDatabase}
        className="p-2 bg-red-500 text-white rounded"
      >
        Clear Database
      </button>
      <MusicLibrary />
      <Player />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <MusicProvider>
      <App />
    </MusicProvider>
  </React.StrictMode>
);