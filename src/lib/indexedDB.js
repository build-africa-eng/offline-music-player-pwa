import { openDB } from 'idb';

const DB_NAME = 'music_db';
const DB_VERSION = 3; // Incremented version to create new object store

async function initDB() {
  return await openDB(DB_NAME, DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        // Initial setup (from previous context)
        db.createObjectStore('songs', { keyPath: 'id' });
        const playlistStore = db.createObjectStore('playlists', { keyPath: 'id' });
        playlistStore.createIndex('songs', 'songIds', 'songId', { unique: false });
      }
      if (oldVersion < 3) { // Add file store for blobs
        db.createObjectStore('files', { keyPath: 'id' });
      }
    },
  });
}

export async function addSong(song) {
  const db = await initDB();
  return await db.put('songs', song);
}

export async function addFile(fileId, blob) {
  const db = await initDB();
  return await db.put('files', { id: fileId, blob });
}

export async function getFile(fileId) {
  const db = await initDB(); // Fixed: Removed duplicate 'const'
  return await db.get('files', fileId);
}

export async function getSongs() {
  const db = await initDB();
  return await (await db.getAll('songs')).sort((a, b) => a.id.localeCompare(b.id));
}

export async function getPlaylists() {
  const db = await initDB();
  return await (await db.getAll('playlists')).sort((a, b) => a.id - b.id);
}

export async function updatePlaylist(playlist) {
  const db = await initDB();
  return await db.put('playlists', playlist);
}

export async function addPlaylist(playlist) {
  const db = await initDB();
  return await db.put('playlists', playlist);
}

export async function deletePlaylist(playlistId) {
  const db = await initDB();
  return await db.delete('playlists', playlistId);
}

export async function deleteSong(songId) {
  const db = await initDB();
  const tx = db.transaction(['songs', 'playlists', 'files'], 'readwrite');
  const songStore = tx.objectStore('songs');
  const playlistStore = tx.objectStore('playlists');
  const fileStore = tx.objectStore('files');

  // Delete song
  await songStore.delete(songId);

  // Delete associated file
  await fileStore.delete(songId);

  // Remove song from all playlists
  const playlists = await playlistStore.getAll();
  for (const playlist of playlists) {
    if (playlist.songIds.includes(songId)) {
      playlist.songIds = playlist.songIds.filter(id => id !== songId);
      await playlistStore.put(playlist);
    }
  }

  await tx.done;
}