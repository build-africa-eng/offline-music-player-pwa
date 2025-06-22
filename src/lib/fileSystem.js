import { extractMetadata } from './metadata';

export async function selectMusicDirectory() {
  try {
    const dirHandle = await window.showDirectoryPicker();
    const files = [];
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file' && entry.name.match(/\.(mp3|wav|ogg)$/i)) {
        const file = await entry.getFile();
        if (!file) {
          console.warn('Failed to get file for entry:', entry.name);
          continue;
        }
        const metadata = await extractMetadata(file);
        files.push({ file, title: metadata.title, artist: metadata.artist });
      }
    }
    console.log('Directory picker returned:', files.length, 'files');
    return { files };
  } catch (err) {
    console.error('Error accessing directory:', err);
    return { files: [] };
  }
}
