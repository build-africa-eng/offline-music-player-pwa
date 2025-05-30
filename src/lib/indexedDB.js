import { openDB } from 'idb';

export async function initDB() {
  return openDB('music-db', 2, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('songs', { keyPath: 'id' });
        db.createObjectStore('playlists', { keyPath: 'id' });
      }
      if (oldVersion < 2) {
        // Ensure playlists store exists for older databases
        if (!db.objectStoreNames.contains('playlists')) {
          db.createObjectStore('playlists', { keyPath: 'id' });
        }
      }
    },
  });
}

export async function addSong(song) {
  const db = await initDB();
  await db.put('songs', song);
}

export async function getSongs() {
  const db = await initDB();
  return db.getAll('songs');
}

export async function addPlaylist(playlist) {
  const db = await initDB();
  const id = `playlist-${Date.now()}`; // Unique ID
  await db.put('playlists', { id, name: playlist.name, songIds: playlist.songIds || [] });
  return id;
}

export async function getPlaylists() {
  const db = await initDB();
  return db.getAll('playlists');
}

export async function updatePlaylist(playlist) {
  const db = await initDB();
  await db.put('playlists', playlist);
}

export async function deletePlaylist(id) {
  const db = await initDB();
  await db.delete('playlists', id);
}

export async function getSongById(id) {
  const db = await initDB();
  return db.get('songs', id);
}