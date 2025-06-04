import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { selectMusicDirectory } from '../lib/fileSystem';
import { addSong, getSongs, getPlaylists, updatePlaylist, addFile, getFile } from '../lib/indexedDB';
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
  const fileMapRef = useRef(new Map()); // Temporary storage during session

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

  const isAudioFile = (file) => {
    const hasValidType = file?.type?.startsWith('audio/');
    const hasExtension = /\.[a-z0-9]+$/i.test(file?.name || '');
    return hasValidType || hasExtension;
  };

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
        if (!isAudioFile(file)) continue;
        const metadata = await extractMetadata(file);
        const songData = { ...metadata };
        await addSong(songData);
        await addFile(metadata.id, file);
        fileMapRef.current.set(metadata.id, file);
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
    if (!file || !isAudioFile(file)) {
      console.error('Unsupported file type:', file?.type, file?.name);
      setError('Unsupported file type. Please upload a valid audio file.');
      toast.error('Unsupported file type. Please upload a valid audio file.');
      return;
    }

    try {
      setError(null);
      console.log('Uploading file:', file.name, 'type:', file.type);

      const metadata = await extractMetadata(file);
      const songData = { ...metadata };

      await addSong(songData);
      await addFile(metadata.id, file);
      fileMapRef.current.set(metadata.id, file);
      setCurrentFile(songData);

      const updatedSongs = await getSongs();
      setSongs(updatedSongs);
      setQueue(updatedSongs);
      toast.success('Song uploaded!');
    } catch (err) {
      console.error('Error uploading song:', err);
      setError('Failed to upload song.');
      toast.error('Failed to upload song.');
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
        const song = songs.find((s) => s.id === songId);
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