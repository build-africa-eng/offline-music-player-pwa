import { useState, useEffect, useRef } from 'react';
import { selectMusicDirectory } from '../lib/fileSystem';
import { addSong, getSongs, getPlaylists, updatePlaylist, addFile, getFile } from '../lib/indexedDB';
import { extractMetadata } from '../lib/metadata';
import toast from 'react-hot-toast';

export function useMusicManager(setSongs, setPlaylists, setQueue, setCurrentFile, setError) {
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
  }, [setSongs, setPlaylists, setQueue, setError]);

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
        if (!file.type.startsWith('audio/')) continue;

        const metadata = await extractMetadata(file);
        await addSong(metadata);
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
    if (!file || !file.type.startsWith('audio/')) {
      console.error('Unsupported file type:', file?.type, file?.name);
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
        const song = (await getSongs()).find(s => s.id === songId);
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
      const playlists = await getPlaylists();
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

  return { fileMapRef, handleSelectDirectory, handleUpload, selectSong, addToPlaylist };
}