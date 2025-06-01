import { useState, useEffect } from 'react';
import MusicLibrary from './components/MusicLibrary';
import Player from './components/Player';
import Playlist from './components/Playlist';
import { MusicProvider } from './context/MusicContext';
import { Toaster } from 'react-hot-toast';

function App() {
  const [view, setView] = useState('library');
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
    // Preload images
    wallpapers.forEach(url => {
      const img = new Image();
      img.src = url;
      img.onload = () => console.log(`Preloaded: ${url}`);
    });

    const interval = setInterval(() => {
      const next = wallpapers[Math.floor(Math.random() * wallpapers.length)];
      const img = new Image();
      img.src = next;
      img.onload = () => {
        setNextBackground(next);
        setIsFading(true);
        setTimeout(() => {
          setCurrentBackground(next);
          setIsFading(false);
          setNextBackground(null);
        }, 1000); // Match transition duration
      };
    }, 5000); // Every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <MusicProvider>
      <div className="min-h-screen relative">
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out"
          style={{ backgroundImage: `url(${currentBackground})`, opacity: isFading ? 0 : 1 }}
        />
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out"
          style={{ backgroundImage: nextBackground ? `url(${nextBackground})` : 'none', opacity: isFading ? 1 : 0 }}
        />
        <div className="absolute inset-0 bg-black/50 z-0" />
        <div className="relative z-10 text-white p-3 sm:p-4">
          <header className="bg-primary text-white shadow rounded-lg mb-3 sm:mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold p-3 sm:p-4">Offline Music Player</h1>
          </header>
          <main className="max-w-4xl mx-auto">
            <Player />
            <div className="flex mb-3 sm:mb-4 space-x-2 overflow-x-auto">
              <button
                onClick={() => setView('library')}
                className={`px-3 sm:px-4 py-1 sm:py-2 rounded-lg text-sm sm:text-base transition-colors ${view === 'library' ? 'bg-primary text-white' : 'bg-background/80 text-text hover:bg-secondary hover:text-white'}`}
              >
                Library
              </button>
              <button
                onClick={() => setView('playlists')}
                className={`px-3 sm:px-4 py-1 sm:py-2 rounded-lg text-sm sm:text-base transition-colors ${view === 'playlists' ? 'bg-primary text-white' : 'bg-background/80 text-text hover:bg-secondary hover:text-white'}`}
              >
                Playlists
              </button>
            </div>
            {view === 'library' && <MusicLibrary />}
            {view === 'playlists' && <Playlist />}
          </main>
        </div>
        <Toaster position="top-center" toastOptions={{ duration: 2000 }} />
      </div>
    </MusicProvider>
  );
}

export default App;