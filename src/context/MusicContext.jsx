import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { selectMusicDirectory } from '../lib/fileSystem';
import { addSong, getSongs, getPlaylists, updatePlaylist } from '../lib/indexedDB';
import { extractMetadata } from '../lib/metadata';
import toast from 'react-hot-toast';

const MusicContext = createContext();

export function MusicProvider({ children }) {
  const [currentFile, setCurrentFile] = useState(null);
  const [error, setError] = useState(null);
  const [songs, setSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const fileMapRef = useRef(new Map());

  useEffect(() => {
    async function loadData() {
      try {
        const [songList, playlistList] = await Promise.all([getSongs(), getPlaylists()]);
        setSongs(songList);
        setPlaylists(playlistList);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data.');
      }
    }
    loadData();
  }, []);

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
        await addSong({ ...metadata });
        fileMapRef.current.set(metadata.id, file);
      }
      const updatedSongs = await getSongs();
      setSongs(updatedSongs);
      toast.success('Music folder loaded!');
    } catch (err) {
      console.error('Error selecting directory:', err);
      setError('Failed to load music files.');
      toast.error('Failed to load music files.');
    }
  };

  const handleUpload = async (file) => {
    try {
      setError(null);
      const metadata = await extractMetadata(file);
      await addSong({ ...metadata });
      fileMapRef.current.set(metadata.id, file);
      setCurrentFile(file);
      const updatedSongs = await getSongs();
      setSongs(updatedSongs);
      toast.success('Song uploaded!');
    } catch (err) {
      console.error('Error uploading song:', err);
      setError('Failed to upload song.');
      toast.error('Failed to upload song.');
    }
  };

  const handleSongSelect = (file) => {
    try {
      setError(null);
      setCurrentFile(file);
    } catch (err) {
      console.error('Error selecting song:', err);
      setError('Failed to play song.');
      toast.error('Failed to play song.');
    }
  };

  const handlePlaylistSongSelect = (songId) => {
    const file = fileMapRef.current.get(songId);
    if (file) {
      setCurrentFile(file);
    } else {
      setError('Song file not found. Please reselect music folder.');
      toast.error('Song file not found. Reselect music folder.');
    }
  };

  const addToPlaylist = async (songId, playlistId) => {
    try {
      setError(null);
      const playlist = playlists.find(p => p.id === playlistId);
      if (playlist && !playlist.songIds.includes(songId)) {
        const updatedPlaylist = {
          ...playlist,
          songIds: [...playlist.songIds, songId],
        };
        await updatePlaylist(updatedPlaylist);
        const updatedPlaylists = await getPlaylists();
        setPlaylists(updatedPlaylists);
        toast.success('Song added to playlist!');
      }
    } catch (err) {
      console.error('Error adding song to playlist:', err);
      setError('Failed to add song to playlist.');
      toast.error('Failed to add song to playlist.');
    }
  };

  return (
    <MusicContext.Provider
      value={{
        currentFile,
        error,
        songs,
        playlists,
        handleSelectDirectory,
        handleUpload,
        handleSongSelect,
        handlePlaylistSongSelect,
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