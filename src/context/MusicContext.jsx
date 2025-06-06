import { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  addSong, getSongs, deleteSong, addFile, getFile, addPlaylist, updatePlaylist, deletePlaylist, getPlaylists, getSongById,
} from '../lib/indexedDB';
import { toast } from 'react-hot-toast';

const MusicContext = createContext();

export function MusicProvider({ children }) {
  const [songs, setSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [queue, setQueue] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);
  const [error, setError] = useState(null);
  const fileMapRef = useRef(new Map());

  // Load initial data from IndexedDB
  useEffect(() => {
    async function loadData() {
      try {
        const [songList, playlistList] = await Promise.all([getSongs(), getPlaylists()]);
        setSongs(Array.isArray(songList) ? songList : []);
        setPlaylists(Array.isArray(playlistList) ? playlistList : []);
        setQueue(Array.isArray(songList) ? songList : []);

        for (const song of songList || []) {
          try {
            const fileData = await getFile(song.id);
            if (fileData?.blob) {
              fileMapRef.current.set(song.id, fileData.blob);
            }
          } catch (fileErr) {
            console.warn(`Failed to load file for song ${song.id}:`, fileErr);
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data. Please reselect your music folder.');
        setSongs([]);
        setPlaylists([]);
        setQueue([]);
        toast.error('Failed to load data.');
      }
    }
    loadData();
  }, []);

  // Handle directory or file selection
  const handleSelectDirectory = async (event) => {
    try {
      const files = event.target.files || [];
      if (!files.length) throw new Error('No files selected');

      const newSongs = [];
      for (const file of files) {
        if (file.type.startsWith('audio/')) {
          const song = {
            id: crypto.randomUUID(),
            title: file.name.replace(/\.[^/.]+$/, ''),
            artist: 'Unknown',
            duration: 0, // Placeholder; can be updated with metadata parsing
          };
          await addSong(song);
          await addFile(song.id, file);
          newSongs.push(song);
          fileMapRef.current.set(song.id, file);
        }
      }

      setSongs((prev) => [...prev, ...newSongs]);
      setQueue((prev) => [...prev, ...newSongs]);
      toast.success(`Added ${newSongs.length} song(s) successfully`);
    } catch (err) {
      console.error('Error selecting directory or uploading files:', err);
      setError('Failed to upload songs. Please try again.');
      toast.error('Failed to upload songs.');
    }
  };

  // Select a song to play
  const selectSong = async (songId) => {
    try {
      const song = await getSongById(songId);
      if (song) {
        const fileData = await getFile(songId);
        if (fileData?.blob) {
          setCurrentFile({ ...song, blob: fileData.blob });
        } else {
          setError('File not found for selected song.');
          toast.error('File not found.');
        }
      }
    } catch (err) {
      console.error('Error selecting song:', err);
      setError('Failed to select song.');
      toast.error('Failed to select song.');
    }
  };

  // Add song to playlist
  const addToPlaylist = async (songId, playlistId) => {
    try {
      if (!playlistId) throw new Error('No playlist selected');
      const playlist = playlists.find((p) => p.id === playlistId);
      if (playlist) {
        if (!playlist.songIds.includes(songId)) {
          playlist.songIds = [...(playlist.songIds || []), songId];
          await updatePlaylist(playlist);
          setPlaylists((prev) =>
            prev.map((p) => (p.id === playlistId ? playlist : p))
          );
          toast.success('Song added to playlist');
        } else {
          toast.info('Song already in playlist');
        }
      }
    } catch (err) {
      console.error('Error adding to playlist:', err);
      setError('Failed to add song to playlist.');
      toast.error('Failed to add song to playlist.');
    }
  };

  // Clear the music library
  const clearLibrary = async () => {
    try {
      if (window.confirm('Are you sure you want to clear your music library? This action cannot be undone.')) {
        for (const song of songs || []) {
          await deleteSong(song.id);
        }
        fileMapRef.current.clear();
        setSongs([]);
        setPlaylists([]);
        setQueue([]);
        setCurrentFile(null);
        toast.success('Library cleared successfully');
      }
    } catch (err) {
      console.error('Error clearing library:', err);
      setError('Failed to clear library');
      toast.error('Failed to clear library');
    }
  };

  const value = {
    songs,
    playlists,
    queue,
    currentFile,
    error,
    setQueue,
    setCurrentFile,
    setError,
    handleSelectDirectory,
    selectSong,
    addToPlaylist,
    clearLibrary,
  };

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}

export function useMusic() {
  return useContext(MusicContext);
}