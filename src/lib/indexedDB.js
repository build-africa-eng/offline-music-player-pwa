import { openDB } from 'idb';

const DB_NAME = 'SongsDB';
const SONGS_STORE = 'songs';
const PLAYLISTS_STORE = 'playlists';

async function getDb() {
  return await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(SONGS_STORE)) {
        db.createObjectStore(SONGS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(PLAYLISTS_STORE)) {
        db.createObjectStore(PLAYLISTS_STORE, { keyPath: 'id' });
      }
    },
  });
}

export async function addSong(song) {
  const db = await getDb();
  await db.put(SONGS_STORE, song);
}

export async function getSongs() {
  const db = await getDb();
  return await db.getAll(SONGS_STORE);
}

export async function createPlaylist(name, songIds = []) {
  const db = await getDb();
  const id = crypto.randomUUID();
  await db.put(PLAYLISTS_STORE, { id, name, songIds });
  return id;
}

export async function getPlaylists() {
  const db = await getDb();
  return await db.getAll(PLAYLISTS_STORE);
}

export async function updatePlaylist(playlist) {
  const db = await getDb();
  await db.put(PLAYLISTS_STORE, playlist);
}

export async function deletePlaylist(id) {
  const db = await getDb();
  await db.delete(PLAYLISTS_STORE, id);
}