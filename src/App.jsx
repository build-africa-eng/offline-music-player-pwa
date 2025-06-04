import { useState, useEffect, useRef } from 'react';
import MusicLibrary from './components/MusicLibrary';
import Player from './components/Player';
import Playlist from './components/Playlist';
import { MusicProvider } from './context/MusicContext';
import { Toaster } from 'react-hot-toast';
import { addSwipeGestures } from './lib/gestures';

function App() {
  const [view, setView] = useState('library');
  const mainRef = useRef(null);
  const wallpapers = [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1448375240586-882707db888b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1494500764479-0c8f2919a3d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
  ];
  const [currentBackground, setCurrentBackground] = useState(wallpapers[0]);
  const [nextBackground, setNextBackground] = useState(null);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    wallpapers.forEach((url) => {
      const img = new Image();
      img.src = url;
      img.onload = () => console.log(`Preloaded: ${url}`);
    });

    const interval = setInterval(() => {
      const next = wallpapers[Math.floor(Math.random() * wallpapers.length)];
      setNextBackground(next);
      setIsFading(true);
      setTimeout(() => {
        setCurrentBackground(next);
        setIsFading(false);
        setNextBackground(null);
      }, 500);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!mainRef.current) return;
    const cleanup = addSwipeGestures(
      mainRef.current,
      () => setView('library'),
      () => setView('playlists')
    );
    return cleanup;
  }, []);

  return (
    <MusicProvider>
      <div className="min-h-screen relative">
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-500 ease-in-out"
          style={{ backgroundImage: `url(${currentBackground})`, opacity: isFading ? 0 : 1 }}
        />
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-500 ease-in-out"
          style={{
            backgroundImage: nextBackground ? `url(${nextBackground})` : 'none',
            opacity: isFading ? 1 : 0,
          }}
        />
        <div className="absolute inset-0 bg-black/50 z-0" />
        <div className="relative z-10 text-white p-3 sm:p-4 pb-24 sm:pb-32">
          <header className="bg-primary text-white shadow rounded-lg mb-3 sm:mb-4 flex items-center gap-2 p-3 sm:p-4">
            <img
              src="/logo.png"
              alt="App Logo"
              className="w-8 h-8 rounded"
              onError={(e) => {
                console.error('Logo load error:', e);
                e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="white" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5zm4 4h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg>';
              }}
            />
            <h1 className="text-2xl sm:text-3xl font-bold">Offline Music Player</h1>
          </header>
          <main ref={mainRef} className="max-w-4xl mx-auto">
            <div className="flex mb-3 sm:mb-4 space-x-2 overflow-x-auto">
              <button
                onClick={() => setView('library')}
                className={`px-3 sm:px-4 py-1 sm:py-2 rounded-lg text-sm sm:text-base transition-colors ${
                  view === 'library' ? 'bg-primary text-white' : 'bg-background/80 text-text hover:bg-secondary hover:text-white'
                }`}
                aria-label="View music library"
              >
                Library
              </button>
              <button
                onClick={() => setView('playlists')}
                className={`px-3 sm:px-4 py-1 sm:py-2 rounded-lg text-sm sm:text-base transition-colors ${
                  view === 'playlists' ? 'bg-primary text-white' : 'bg-background/80 text-text hover:bg-secondary hover:text-white'
                }`}
                aria-label="View playlists"
              >
                Playlists
              </button>
            </div>
            {view === 'library' && <MusicLibrary />}
            {view === 'playlists' && <Playlist />}
            <Player queue={songs} currentFile={currentFile} fileMap={fileMap} selectSong={selectSong} waveform={null} /> {/* Add Player here */}
          </main>
        </div>
        <Toaster position="top-center" toastOptions={{ duration: 2000 }} />
      </div>
    </MusicProvider>
  );
}

export default App;