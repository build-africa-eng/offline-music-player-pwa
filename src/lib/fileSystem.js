// src/lib/fileSystem.js

/**
 * Opens a file input dialog to allow the user to select multiple audio files.
 * Returns an array of file metadata objects and a fileMap for in-memory access.
 */
export async function selectMusicDirectory() {
  const files = [];
  const fileMap = new Map();
  const queue = [];

  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  input.accept = 'audio/*';

  return new Promise((resolve, reject) => {
    input.onchange = async () => {
      if (!input.files.length) {
        reject(new Error('No files selected'));
        return;
      }

      for (const file of input.files) {
        if (!file.type.startsWith('audio/')) {
          console.warn(`Skipping non-audio file: ${file.name}`);
          continue;
        }

        const id = crypto.randomUUID();
        fileMap.set(id, file);
        queue.push({
          id,
          name: file.name,
          type: file.type,
          title: file.name.split('.').slice(0, -1).join('.'),
          artist: 'Unknown', // Could later be improved with metadata extraction
        });
      }

      if (!queue.length) {
        reject(new Error('No valid audio files selected'));
        return;
      }

      resolve({ files: queue, fileMap });
    };

    input.onerror = () => {
      reject(new Error('Error selecting files'));
    };

    input.click();
  });
}

/**
 * Retrieves a file by ID from the provided fileMap.
 */
export async function getFile(id, fileMap) {
  return fileMap.get(id);
}