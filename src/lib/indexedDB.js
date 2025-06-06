import { openDB } from 'idb';

const DB_NAME = 'music_db';
const DB_VERSION = 3;

async function initDB() {
  try {
    return await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore('songs', { keyPath: 'id' });
          db.createObjectStore('playlists', { keyPath: 'id' });
        }
        if (oldVersion < 2) {
          // No changes between 1 and 2 (placeholder)
        }
        if (oldVersion < 3) {
          const filesStore = db.createObjectStore('files', { keyPath: 'id' });
          // Migrate existing song files if needed (e.g., if stored differently)
          const songStore = db.transaction.objectStore('songs');
          songStore.openCursor().onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
              // Assume files were stored under song.id previously
              // This is a placeholder; adjust based on your data structure
              filesStore.put({ id: cursor.value.id, blob: null }); // Initialize with null
              cursor.continue();
            }
          };
        }
      },
      blocked() {
        console.warn('Database upgrade blocked by an open connection. Please close other tabs.');
      },
      blocking() {
        console.warn('A connection is blocking the database upgrade. Closing it.');
      },
      terminated() {
        console.warn('Database connection terminated unexpectedly.');
      },
    });
  } catch (err) {
    console.error('Failed to initialize IndexedDB:', err);
    throw err; // Let the caller handle this
  }
}

// SONGS
export async function addSong(song) {
  const db = await initDB();
  return await db.put('songs', song);
}

export async function getSongs() {
  const db = await initDB();
  const songs = await db.getAll('songs');
  return songs.sort((a, b) => a.title.localeCompare(b.title));
}

export async function getSongById(songId) {
  const db = await initDB();
  return await db.get('songs', songId);
}

export async function deleteSong(songId) {
  const db = await initDB();
  const tx = db.transaction(['songs', 'playlists', 'files'], 'readwrite');
  const [songStore, playlistStore, fileStore] = [
    tx.objectStore('songs'),
    tx.objectStore('playlists'),
    tx.objectStore('files'),
  ];

  await Promise.all([songStore.delete(songId), fileStore.delete(songId)]);

  const playlists = await playlistStore.getAll();
  await Promise.all(
    playlists.map(async (playlist) => {
      if (playlist.songIds.includes(songId)) {
        playlist.songIds = playlist.songIds.filter((id) => id !== songId);
        await playlistStore.put(playlist);
      }
    })
  );

  await tx.done;
}

// FILES
export async function addFile(fileId, blob) {
  const db = await initDB();
  return await db.put('files', { id: fileId, blob });
}

export async function getFile(fileId) {
  const db = await initDB();
  const file = await db.get('files', fileId);
  return file || null; // Return null if not found
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
  const playlists = await db.getAll('playlists');
  return playlists.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getPlaylistById(id) {
  const db = await initDB();
  return await db.get('playlists', id);
}