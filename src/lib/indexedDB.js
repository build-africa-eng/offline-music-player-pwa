import { openDB } from 'idb';
export async function initDB() {
  return openDB('music-db', 1, {
    upgrade(db) {
      db.createObjectStore('songs', { keyPath: 'id' });
      db.createObjectStore('playlists', { keyPath: 'id' });
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
