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
      for (const { file } of files) {
        if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg)$/i)) continue;
        const metadata = await extractMetadata(file);
        await addSong({ ...metadata });
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
    if (!file || (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg)$/i))) {
      setError('Please select a valid audio file (.mp3, .wav, .ogg).');
      toast.error('Please select a valid audio file.');
      return;
    }
    try {
      setError(null);
      const metadata = await extractMetadata(file);
      await addSong({ ...metadata });
      fileMapRef.current.set(metadata.id, file);
      setCurrentFile(file);
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

  const selectSong = (songId) => {
    const file = fileMapRef.current.get(songId);
    if (file) {
      setCurrentFile(file);
      setError(null);
    } else {
      setError('Song file not found. Please reselect music folder.');
      toast.error('Song file not found. Reselect music folder.');
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