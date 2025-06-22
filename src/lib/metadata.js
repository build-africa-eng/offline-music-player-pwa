import { parseBlob } from 'music-metadata';

export async function extractMetadata(file) {
  try {
    const metadata = await parseBlob(file);
    return {
      title: metadata.common.title || file.name?.replace(/\.[^/.]+$/, '') || 'Untitled',
      artist: metadata.common.artist || 'Unknown',
    };
  } catch (err) {
    console.warn('Metadata extraction failed:', err);
    return {
      title: file.name?.replace(/\.[^/.]+$/, '') || 'Untitled',
      artist: 'Unknown',
    };
  }
}
