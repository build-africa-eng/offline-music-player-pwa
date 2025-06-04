import { createContext, useContext, useState } from 'react';
import { useMusicManager } from '../hooks/useMusicManager';

const MusicContext = createContext();

export function MusicProvider({ children }) {
  const [currentFile, setCurrentFile] = useState(null);
  const [error, setError] = useState(null);
  const [songs, setSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [queue, setQueue] = useState([]);
  const [shuffle, setShuffle] = useState(() => JSON.parse(localStorage.getItem('playerShuffle')) || false);
  const [repeat, setRepeat] = useState(() => localStorage.getItem('playerRepeat') || 'off');

  const { fileMapRef, handleSelectDirectory, handleUpload, selectSong, addToPlaylist } = useMusicManager(
    setSongs,
    setPlaylists,
    setQueue,
    setCurrentFile,
    setError
  );

  useEffect(() => {
    localStorage.setItem('playerShuffle', JSON.stringify(shuffle));
  }, [shuffle]);

  useEffect(() => {
    localStorage.setItem('playerRepeat', repeat);
  }, [repeat]);

  return (
    <MusicContext.Provider
      value={{
        currentFile,
        error,
        songs,
        playlists,
        queue,
        setQueue,
        shuffle,
        setShuffle,
        repeat,
        setRepeat,
        fileMapRef,
        handleSelectDirectory,
        handleUpload,
        selectSong,
        addToPlaylist,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  return useContext(MusicContext);
}