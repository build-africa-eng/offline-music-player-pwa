export async function loadFiles() {
  const files = [];
  const fileMap = new Map();
  const queue = [];

  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  input.accept = 'audio/*'; // Changed from specific formats to all audio formats

  return new Promise((resolve, reject) => {
    input.onchange = async () => {
      if (!input.files.length) {
        reject(new Error('No files selected'));
        return;
      }

      for (const file of input.files) {
        // Optional: Validate file type if needed (but let's remove strict checks)
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
          title: file.name.split('.').slice(0, -1).join('.'), // Extract title from filename
          artist: 'Unknown', // Placeholder: Could extract from metadata
          // Add more metadata if needed
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

export async function getFile(id, fileMap) {
  return fileMap.get(id);
}