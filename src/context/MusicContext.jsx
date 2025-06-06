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
  const [isPlaying, setIsPlaying] = useState(false); // Add playback state
  const [playerMode, setPlayerMode] = useState('mini'); // 'mini' or 'full'
  const fileMapRef = useRef(new Map());
  const audioRef = useRef(new Audio()); // Ref for audio element

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

  // Update audio source when currentFile changes
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

  // Handle single file upload
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

  // Handle directory or multiple files selection
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

  // Select a song to play
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

  // Toggle play/pause
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

  // Skip to next/previous song
  const skipTrack = (direction) => {
    if (!currentFile || !queue.length) return;
    const currentIndex = queue.findIndex((song) => song.id === currentFile.id);
    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex < 0) newIndex = queue.length - 1;
    if (newIndex >= queue.length) newIndex = 0;
    selectSong(queue[newIndex].id);
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
    setPlayerMode, // Expose to toggle mini/full
    handleUpload,
    handleSelectDirectory,
    selectSong,
    togglePlayPause,
    skipTrack,
    addToPlaylist,
    clearLibrary,
  };

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}

export function useMusic() {
  return useContext(MusicContext);
}