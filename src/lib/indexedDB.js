import { openDB } from 'idb';

const DB_NAME = 'music-db';
const DB_VERSION = 2;
const SONGS_STORE = 'songs';
const PLAYLISTS_STORE = 'playlists';

async function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore(SONGS_STORE, { keyPath: 'id' });
        db.createObjectStore(PLAYLISTS_STORE, { keyPath: 'id' });
      } else if (oldVersion < 2) {
        if (!db.objectStoreNames.contains(PLAYLISTS_STORE)) {
          db.createObjectStore(PLAYLISTS_STORE, { keyPath: 'id' });
        }
      }
    }
  });
}

// SONGS

export async function addSong(song) {
  const db = await getDb();
  await db.put(SONGS_STORE, song);
}

export async function getSongs() {
  const db = await getDb();
  return db.getAll(SONGS_STORE);
}

export async function getSongById(id) {
  const db = await getDb();
  return db.get(SONGS_STORE, id);
}

// PLAYLISTS

export async function createPlaylist(name, songIds = []) {
  const db = await getDb();
  const id = crypto.randomUUID();
  await db.put(PLAYLISTS_STORE, { id, name, songIds });
  return id;
}

export async function addPlaylist(playlist) {
  const db = await getDb();
  const id = playlist.id || crypto.randomUUID();
  await db.put(PLAYLISTS_STORE, { ...playlist, id });
  return id;
}

export async function getPlaylists() {
  const db = await getDb();
  return db.getAll(PLAYLISTS_STORE);
}

export async function updatePlaylist(playlist) {
  const db = await getDb();
  await db.put(PLAYLISTS_STORE, playlist);
}

export async function deletePlaylist(id) {
  const db = await getDb();
  await db.delete(PLAYLISTS_STORE, id);
}