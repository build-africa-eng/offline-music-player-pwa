import * as mm from 'music-metadata';

export async function extractMetadata(file) {
  try {
    const metadata = await mm.parseBlob(file);
    return {
      id: file.name,
      title: metadata.common.title || file.name,
      artist: metadata.common.artist || 'Unknown',
      album: metadata.common.album || 'Unknown',
      file,
    };
  } catch (err) {
    console.error('Error extracting metadata:', err);
    return {
      id: file.name,
      title: file.name,
      artist: 'Unknown',
      album: 'Unknown',
      file,
    };
  }
}