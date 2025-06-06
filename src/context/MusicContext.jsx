import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { selectMusicDirectory } from '../lib/fileSystem';
import { addSong, getSongs, getPlaylists, updatePlaylist, addFile, getFile, deleteSong } from '../lib/indexedDB';
import { extractMetadata } from '../lib/metadata';
import toast from 'react-hot-toast';

const MusicContext = createContext();

export function MusicProvider({ children }) {
  const [currentFile, setCurrentFile] = useState(null);
  const [error, setError] = useState(null);
  const [songs, setSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [queue, setQueue] = useState([]);
  const [shuffle, setShuffle] = useState(() => JSON.parse(localStorage.getItem('playerShuffle')) || false);
  const [repeat, setRepeat] = useState(() => localStorage.getItem('playerRepeat') || 'off');
  const fileMapRef = useRef(new Map());

  useEffect(() => {
    async function loadData() {
      try {
        const [songList, playlistList] = await Promise.all([getSongs(), getPlaylists()]);
        setSongs(songList);
        setPlaylists(playlistList);
        setQueue(songList);

        for (const song of songList) {
          const fileData = await getFile(song.id);
          if (fileData?.blob) {
            fileMapRef.current.set(song.id, fileData.blob);
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data.');
        toast.error('Failed to load data.');
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    localStorage.setItem('playerShuffle', JSON.stringify(shuffle));
  }, [shuffle]);

  useEffect(() => {
    localStorage.setItem('playerRepeat', repeat);
  }, [repeat]);

  const handleSelectDirectory = async () => {
    try {
      setError(null);
      const result = await selectMusicDirectory();
      if (!result) {
        setError('No directory selected or access denied.');
        return;
      }
      const { files } = result;
      const totalFiles = files.length;
      let processed = 0;

      for (const { file } of files) {
        if (!file.type.startsWith('audio/')) continue;

        const metadata = await extractMetadata(file);
        await addSong(metadata);
        await addFile(metadata.id, file);
        fileMapRef.current.set(metadata.id, file);

        processed++;
        toast(`Processing ${processed}/${totalFiles} files...`, { id: 'progress', duration: 2000 });
      }

      const updatedSongs = await getSongs();
      setSongs(updatedSongs);
      setQueue(updatedSongs);
      toast.success('Music folder loaded!');
    } catch (err) {
      console.error('Error selecting directory:', err);
      setError('Failed to load music files.');
      toast.error('Failed to load music files.');
    }
  };

  const handleUpload = async (file) => {
    if (!file || !file.type.startsWith('audio/')) {
      console.error('Unsupported file type:', { type: file?.type, name: file?.name });
      setError('Unsupported file type. Please upload a valid audio file.');
      toast.error('Unsupported file type. Please upload a valid audio file.');
      return;
    }

    try {
      setError(null);
      const metadata = await extractMetadata(file);
      await addSong(metadata);
      await addFile(metadata.id, file);
      fileMapRef.current.set(metadata.id, file);
      setCurrentFile(metadata);

      const updatedSongs = await getSongs();
      setSongs(updatedSongs);
      setQueue(updatedSongs);
      toast.success('Song uploaded!');
    } catch (err) {
      console.error('Error uploading song:', { name: file.name, error: err.message });
      setError('Failed to upload song.');
      toast.error('Failed to upload song.');
    }
  };

  const handleUploadLyrics = async (file, songId) => {
    if (!file || !file.name.endsWith('.lrc')) {
      console.error('Unsupported file type for lyrics:', { type: file?.type, name: file?.name });
      setError('Please upload a valid .lrc file.');
      toast.error('Please upload a valid .lrc file.');
      return;
    }

    try {
      setError(null);
      const text = await file.text();
      await addFile(`${songId}-lyrics`, text); // Store lyrics in IndexedDB
      toast.success('Lyrics uploaded successfully!');
    } catch (err) {
      console.error('Error uploading lyrics:', { name: file.name, error: err.message });
      setError('Failed to upload lyrics.');
      toast.error('Failed to upload lyrics.');
    }
  };

  const getLyrics = async (songId) => {
    try {
      const lyricData = await getFile(`${songId}-lyrics`);
      return lyricData || null;
    } catch (err) {
      console.error('Error retrieving lyrics:', err);
      return null;
    }
  };

  const selectSong = async (songId) => {
    try {
      let file = fileMapRef.current.get(songId);
      if (!file) {
        const fileData = await getFile(songId);
        if (fileData?.blob) {
          fileMapRef.current.set(songId, fileData.blob);
          file = fileData.blob;
        }
      }
      if (file) {
        const song = songs.find(s => s.id === songId);
        setCurrentFile(song);
        setError(null);
      } else {
        setError('Song file not found. Please reselect music folder.');
        toast.error('Song file not found. Reselect music folder.');
      }
    } catch (err) {
      console.error('Error selecting song:', err);
      setError('Failed to select song.');
      toast.error('Failed to select song.');
    }
  };

  const addToPlaylist = async (songId, playlistId) => {
    try {
      setError(null);
      const playlist = playlists.find((p) => p.id === playlistId);
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

  const clearLibrary = async () => {
    try {
      setError(null);
      // Delete all songs, their files, and associated lyrics
      for (const song of songs) {
        await deleteSong(song.id);
        fileMapRef.current.delete(song.id);
        await addFile(`${song.id}-lyrics`, null); // Clear lyrics
      }
      // Reset playlists
      const updatedPlaylists = playlists.map(playlist => ({
        ...playlist,
        songIds: [],
      }));
      for (const playlist of updatedPlaylists) {
        await updatePlaylist(playlist);
      }
      setSongs([]);
      setPlaylists(updatedPlaylists);
      setQueue([]);
      setCurrentFile(null);
      toast.success('Library cleared successfully!');
    } catch (err) {
      console.error('Error clearing library:', err);
      setError('Failed to clear library.');
      toast.error('Failed to clear library.');
    }
  };

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
        handleUploadLyrics, // Added
        getLyrics, // Added
        selectSong,
        addToPlaylist,
        clearLibrary,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  return useContext(MusicContext);
}