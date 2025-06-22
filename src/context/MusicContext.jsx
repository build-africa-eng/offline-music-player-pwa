import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { selectMusicDirectory } from '../lib/fileSystem';
import {
  addSong, getSongs, deleteSong, addFile, getFile, addPlaylist, updatePlaylist, deletePlaylist, getPlaylists, getSongById,
} from '../lib/indexedDB';

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
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    async function loadData() {
      try {
        console.log('Initializing IndexedDB and loading data...');
        const [songList, playlistList] = await Promise.all([getSongs(), getPlaylists()]);
        if (!Array.isArray(songList) || !Array.isArray(playlistList)) {
          throw new Error('Invalid data format from IndexedDB');
        }

        const validSongs = [];
        for (const song of songList) {
          const fileData = await getFile(song.id);
          if (fileData?.blob) {
            fileMapRef.current.set(song.id, fileData.blob);
            validSongs.push(song);
          } else {
            console.warn(`No blob found for song ${song.id}, removing from songs list`);
            await deleteSong(song.id);
          }
        }

        setSongs(validSongs);
        setPlaylists(playlistList);
        setQueue(validSongs);
        console.log('Data loaded successfully:', { songCount: validSongs.length, playlistCount: playlistList.length });
      } catch (err) {
        console.error('Error loading data from IndexedDB:', err);
        setError('Failed to load data. Please reselect your music folder or clear the database.');
        toast.error('Failed to load data. Check console for details.');
      }
    }
    loadData();
  }, []);

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

  const handleSelectDirectory = async (event) => {
    try {
      let files = [];
      if (event?.target?.files) {
        files = Array.from(event.target.files)
          .filter(file => file.type.startsWith('audio/') && file instanceof File)
          .map(file => ({
            file,
            title: file.name?.replace(/\.[^/.]+$/, '') || 'Untitled',
            artist: 'Unknown',
          }));
        console.log('File input selected:', files.length, 'files');
      } else {
        const result = await selectMusicDirectory();
        if (result?.files) {
          files = result.files.filter(fileData => fileData?.file instanceof File);
        }
        console.log('Directory picker selected:', files.length, 'files');
      }

      if (!files.length) {
        setError('No valid audio files selected');
        toast.error('No valid audio files selected');
        return;
      }

      const newSongs = [];
      for (const fileData of files) {
        if (!fileData?.file) {
          console.warn('Invalid file data:', fileData);
          continue;
        }
        const { file, title, artist } = fileData;
        const song = {
          id: crypto.randomUUID(),
          title: title || file.name?.replace(/\.[^/.]+$/, '') || 'Untitled',
          artist: artist || 'Unknown',
          duration: 0,
        };
        console.log('Adding song:', song.title);
        await addSong(song);
        await addFile(song.id, file);
        fileMapRef.current.set(song.id, file);
        newSongs.push(song);
      }

      if (newSongs.length) {
        setSongs((prev) => [...prev, ...newSongs]);
        setQueue((prev) => [...prev, ...newSongs]);
        toast.success(`Added ${newSongs.length} song(s)`);
      } else {
        setError('No valid audio files found');
        toast.error('No valid audio files found');
      }
    } catch (err) {
      console.error('Error selecting directory or uploading files:', err);
      setError('Failed to add songs: ' + err.message);
      toast.error('Failed to add songs');
    }
  };

  const selectSong = async (songId) => {
    try {
      const song = await getSongById(songId);
      if (song) {
        const fileData = fileMapRef.current.get(songId) || (await getFile(songId))?.blob;
        if (fileData) {
          setCurrentFile({ ...song, blob: fileData });
          setIsPlaying(true);
        } else {
          setError('File not found for selected song');
          toast.error('File not found');
        }
      }
    } catch (err) {
      console.error('Error selecting song:', err);
      setError('Failed to select song');
      toast.error('Failed to select song');
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((err) => {
        console.error('Error playing audio:', err);
        setError('Failed to play audio');
        toast.error('Failed to play audio');
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
      setError('Failed to add song to playlist');
      toast.error('Failed to add song to playlist');
    }
  };

  const clearLibrary = async () => {
    try {
      for (const song of songs) {
        await deleteSong(song.id);
      }
      fileMapRef.current.clear();
      setSongs([]);
      setPlaylists([]);
      setQueue([]);
      setCurrentFile(null);
      setIsPlaying(false);
      audioRef.current.pause();
      toast.success('Library cleared');
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
    handleSelectDirectory,
    selectSong,
    togglePlayPause,
    skipTrack,
    addToPlaylist,
    clearLibrary,
    fileMapRef,
  };

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}

export function useMusic() {
  return useContext(MusicContext);
}
