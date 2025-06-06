import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { MusicProvider, useMusic } from './context/MusicContext';
import { Toaster, toast } from 'react-hot-toast';
import { addSwipeGestures } from './lib/gestures';
import { Trash2 } from 'lucide-react';

// Lazy-load components
const MusicLibrary = lazy(() => import('./components/MusicLibrary'));
const Player = lazy(() => import('./components/Player'));
const Playlist = lazy(() => import('./components/Playlist'));

function AppContent() {
  const { error, songs, clearLibrary } = useMusic();
  const [view, setView] = useState('library');
  const [isLoading, setIsLoading] = useState(true);
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
    if (songs) {
      setIsLoading(false);
    }
  }, [songs]);

  useEffect(() => {
    const preloadImages = wallpapers.map((url) => {
      const img = new Image();
      img.src = url;
      return new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
    });

    Promise.all(preloadImages)
      .then(() => console.log('All backgrounds preloaded'))
      .catch((err) => console.error('Background preload error:', err));

    const interval = setInterval(() => {
      const next = wallpapers[Math.floor(Math.random() * wallpapers.length)];
      if (next !== currentBackground) {
        setNextBackground(next);
        setIsFading(true);
        setTimeout(() => {
          setCurrentBackground(next);
          setIsFading(false);
          setNextBackground(null);
        }, 500);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [currentBackground]);

  useEffect(() => {
    if (!mainRef.current) return;
    const cleanup = addSwipeGestures(
      mainRef.current,
      () => setView('library'),
      () => setView('playlists')
    );
    return cleanup;
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleClearLibrary = async () => {
    if (window.confirm('Are you sure you want to clear your music library? This action cannot be undone.')) {
      await clearLibrary();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your music library...</p>
        </div>
      </div>
    );
  }

  return (
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
        <header className="bg-primary text-white shadow rounded-lg mb-3 sm:mb-4 flex items-center justify-between gap-2 p-3 sm:p-4">
          <div className="flex items-center gap-2">
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
          </div>
          {songs.length > 0 && (
            <button
              onClick={handleClearLibrary}
              className="bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded-lg flex items-center gap-1 text-sm transition-colors"
              aria-label="Clear music library"
            >
              <Trash2 className="w-4 h-4" /> Clear Library
            </button>
          )}
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
          <Suspense fallback={<div className="text-center text-white">Loading...</div>}>
            {view === 'library' && <MusicLibrary />}
            {view === 'playlists' && <Playlist />}
          </Suspense>
        </main>
      </div>
      <Suspense fallback={<div className="text-center text-white">Loading player...</div>}>
        <Player />
      </Suspense>
      <Toaster position="top-center" toastOptions={{ duration: 2000 }} />
    </div>
  );
}

function App() {
  return (
    <MusicProvider>
      <AppContent />
    </MusicProvider>
  );
}

export default App;