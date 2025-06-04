export async function selectMusicDirectory({ recursive = false } = {}) {
  try {
    const dirHandle = await window.showDirectoryPicker();
    const files = [];

    async function scanDir(handle) {
      for await (const entry of handle.values()) {
        if (entry.kind === 'file' && entry.name.match(/\.(mp3|wav)$/i)) {
          const file = await entry.getFile();
          files.push({
            file,
            handle: entry,
            name: file.name,
            url: URL.createObjectURL(file),
            metadata: null, // Placeholder for future parsing (ID3 tags, duration)
          });
        } else if (recursive && entry.kind === 'directory') {
          await scanDir(entry);
        }
      }
    }

    await scanDir(dirHandle);

    files.sort((a, b) => a.name.localeCompare(b.name)); // Optional: alphabetize

    return { dirHandle, files };
  } catch (error) {
    console.error('Error accessing directory:', error);
    return null;
  }
}