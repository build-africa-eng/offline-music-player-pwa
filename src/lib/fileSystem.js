export async function selectMusicDirectory() {
  try {
    const dirHandle = await window.showDirectoryPicker();
    const files = [];
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file' && entry.name.match(/\.(mp3|wav)$/i)) {
        const file = await entry.getFile();
        files.push({ file, handle: entry });
      }
    }
    return { dirHandle, files };
  } catch (error) {
    console.error('Error accessing directory:', error);
    return null;
  }
}
