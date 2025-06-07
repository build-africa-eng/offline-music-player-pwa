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
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerMode, setPlayerMode] = useState('mini');
  const fileMapRef = useRef(new Map());
  const audioRef = useRef(new Audio());

  useEffect(() => {
    async function loadData() {
      try {
        console.log('Initializing IndexedDB and loading data...');
        const [songList, playlistList] = await Promise.all([getSongs(), getPlaylists()]);
        if (!Array.isArray(songList) || !Array.isArray(playlistList)) {
          throw new Error('Invalid data format from IndexedDB');
        }
        setSongs(songList);
        setPlaylists(playlistList);
        setQueue(songList);

        for (const song of songList) {
          try {
            const fileData = await getFile(song.id);
            if (fileData?.blob) {
              fileMapRef.current.set(song.id, fileData.blob);
            } else {
              console.warn(`No blob found for song ${song.id}, attempting to reload file...`);
              const reloadedFile = await reloadFile(song.id);
              if (reloadedFile?.blob) {
                fileMapRef.current.set(song.id, reloadedFile.blob);
              }
            }
          } catch (fileErr) {
            console.error(`Failed to load file for song ${song.id}:`, fileErr);
          }
        }
        console.log('Data loaded successfully:', { songCount: songList.length, playlistCount: playlistList.length });
      } catch (err) {
        console.error('Error loading data from IndexedDB:', err);
        setError('Failed to load data. Please reselect your music folder or clear the database.');
        setSongs([]);
        setPlaylists([]);
        setQueue([]);
        toast.error('Failed to load data. Check console for details or clear the database.');
      }
    }
    loadData();
  }, []);

  // Helper function to reload a file (optional, based on your needs)
  async function reloadFile(songId) {
    try {
      const song = await getSongById(songId);
      if (song) {
        const fileData = await getFile(songId);
        return fileData || null;
      }
      return null;
    } catch (err) {
      console.error('Error reloading file:', err);
      return null;
    }
  }

  useEffect(() => {
    if (currentFile?.blob) {
      const url = URL.createObjectURL(currentFile.blob);
      audioRef.current.src = url;
      if (isPlaying) {
        audioRef.current.play().catch((err) => {
          console.error('Error playing audio:', err);
          setError('Failed to play audio.');
          toast.error('Failed to play audio.');
        });
      }
      return () => URL.revokeObjectURL(url);
    }
  }, [currentFile]);

  const handleUpload = async (file) => {
    try {
      if (!file) throw new Error('No file provided');
      if (!file.type.startsWith('audio/')) throw new Error('Not an audio file');

      const song = {
        id: crypto.randomUUID(),
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Unknown',
        duration: 0,
      };
      await addSong(song);
      await addFile(song.id, file);
      fileMapRef.current.set(song.id, file);
      setSongs((prev) => [...prev, song]);
      setQueue((prev) => [...prev, song]);
    } catch (err) {
      console.error('Error uploading file:', err);
      throw err;
    }
  };

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
            duration: 0,
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

  const selectSong = async (songId) => {
    try {
      const song = await getSongById(songId);
      if (song) {
        const fileData = await getFile(songId);
        if (fileData?.blob) {
          setCurrentFile({ ...song, blob: fileData.blob });
          setIsPlaying(true);
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

  const togglePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((err) => {
        console.error('Error playing audio:', err);
        setError('Failed to play audio.');
        toast.error('Failed to play audio.');
      });
      setIsPlaying(true);
    }
  };

  const skipTrack = (direction) => {
    if (!currentFile || !queue.length) return;
    const currentIndex = queue.findIndex((song) => song.id === currentFile.id);
    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex < 0) newIndex = queue.length - 1;
    if (newIndex >= queue.length) newIndex = 0;
    selectSong(queue[newIndex].id);
  };

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
        setIsPlaying(false);
        audioRef.current.pause();
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
    isPlaying,
    playerMode,
    setQueue,
    setCurrentFile,
    setError,
    setPlayerMode,
    handleUpload,
    handleSelectDirectory,
    selectSong,
    togglePlayPause,
    skipTrack,
    addToPlaylist,
    clearLibrary,
    fileMapRef, // Expose fileMapRef for usePlayerLogic
  };

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}

export function useMusic() {
  return useContext(MusicContext);
}