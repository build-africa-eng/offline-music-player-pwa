const DB_NAME = 'MusicPlayerDB';
const DB_VERSION = 1;

let db;

export function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Create object stores if they don't exist
      if (!database.objectStoreNames.contains('songs')) {
        database.createObjectStore('songs', { keyPath: 'id', autoIncrement: true })
          .createIndex('title', 'title', { unique: false });
      }
      if (!database.objectStoreNames.contains('playlists')) {
        database.createObjectStore('playlists', { keyPath: 'id', autoIncrement: true })
          .createIndex('name', 'name', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      console.log('IndexedDB initialized successfully');
      resolve(db);
    };

    request.onerror = (event) => {
      console.error('Failed to initialize IndexedDB:', event.target.error);
      reject(event.target.error);
    };
  });
}

export async function addSong(song) {
  const database = db || await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['songs'], 'readwrite');
    const store = transaction.objectStore('songs');
    const request = store.add(song);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getSongs() {
  const database = db || await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['songs'], 'readonly');
    const store = transaction.objectStore('songs');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getSongById(id) {
  const database = db || await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['songs'], 'readonly');
    const store = transaction.objectStore('songs');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteSong(id) {
  const database = db || await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['songs'], 'readwrite');
    const store = transaction.objectStore('songs');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function addFile(file) {
  const database = db || await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['songs'], 'readwrite');
    const store = transaction.objectStore('songs');
    const request = store.add({ file, title: file.name, artist: 'Unknown' });

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getFile(id) {
  const database = db || await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['songs'], 'readonly');
    const store = transaction.objectStore('songs');
    const request = store.get(id);

    request.onsuccess = () => {
      const song = request.result;
      resolve(song ? song.file : null);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function addPlaylist(playlist) {
  const database = db || await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['playlists'], 'readwrite');
    const store = transaction.objectStore('playlists');
    const request = store.add({ ...playlist, songIds: playlist.songIds || [] });

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getPlaylists() {
  const database = db || await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['playlists'], 'readonly');
    const store = transaction.objectStore('playlists');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function updatePlaylist(playlist) {
  const database = db || await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['playlists'], 'readwrite');
    const store = transaction.objectStore('playlists');
    const request = store.put(playlist);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deletePlaylist(id) {
  const database = db || await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['playlists'], 'readwrite');
    const store = transaction.objectStore('playlists');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
