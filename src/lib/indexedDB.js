import { openDB } from 'idb';

const DB_NAME = 'music_db';
const DB_VERSION = 3;

async function initDB() {
  return await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('songs', { keyPath: 'id' });
        db.createObjectStore('playlists', { keyPath: 'id' });
      }
      if (oldVersion < 3) {
        db.createObjectStore('files', { keyPath: 'id' });
      }
    },
  });
}

// SONGS
export async function addSong(song) {
  const db = await initDB();
  return await db.put('songs', song);
}

export async function getSongs() {
  const db = await initDB();
  return (await db.getAll('songs')).sort((a, b) => a.title.localeCompare(b.title));
}

export async function getSongById(songId) {
  const db = await initDB();
  return await db.get('songs', songId);
}

export async function deleteSong(songId) {
  const db = await initDB();
  const tx = db.transaction(['songs', 'playlists', 'files'], 'readwrite');
  const songStore = tx.objectStore('songs');
  const playlistStore = tx.objectStore('playlists');
  const fileStore = tx.objectStore('files');

  await songStore.delete(songId);
  await fileStore.delete(songId);

  const playlists = await playlistStore.getAll();
  for (const playlist of playlists) {
    if (playlist.songIds.includes(songId)) {
      playlist.songIds = playlist.songIds.filter(id => id !== songId);
      await playlistStore.put(playlist);
    }
  }

  await tx.done;
}

// FILES
export async function addFile(fileId, blob) {
  const db = await initDB();
  return await db.put('files', { id: fileId, blob });
}

export async function getFile(fileId) {
  const db = await initDB();
  return await db.get('files', fileId);
}

// PLAYLISTS
export async function addPlaylist(playlist) {
  const db = await initDB();
  return await db.put('playlists', playlist);
}

export async function updatePlaylist(playlist) {
  const db = await initDB();
  return await db.put('playlists', playlist);
}

export async function deletePlaylist(playlistId) {
  const db = await initDB();
  return await db.delete('playlists', playlistId);
}

export async function getPlaylists() {
  const db = await initDB();
  return (await db.getAll('playlists')).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getPlaylistById(id) {
  const db = await initDB();
  return await db.get('playlists', id);
}