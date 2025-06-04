import { parseBlob } from 'music-metadata';

/**
 * Lightweight metadata fallback: filename only.
 */
export function extractMetadataLite(file) {
  const title = file.name.split('.').slice(0, -1).join('.');
  return {
    id: crypto.randomUUID(),
    title,
    artist: 'Unknown',
    album: 'Unknown',
    picture: null,
    duration: 0,
  };
}

/**
 * Full metadata extraction with automatic fallback to lite.
 * @param {File} file - The audio file.
 * @returns {Promise<object>} Extracted metadata.
 */
export async function extractMetadata(file) {
  const fallback = extractMetadataLite(file); // Use if all else fails

  try {
    // Optional: prevent large file parsing on low-memory devices
    if (navigator.deviceMemory && navigator.deviceMemory <= 2 && file.size > 3 * 1024 * 1024) {
      console.warn('Low memory device detected. Using lite metadata.');
      return fallback;
    }

    const metadata = await parseBlob(file, { duration: true });

    const title = metadata.common.title || fallback.title;
    const artist = metadata.common.artist || fallback.artist;
    const album = metadata.common.album || fallback.album;
    const duration = metadata.format.duration || 0;

    let picture = null;
    if (metadata.common.picture && metadata.common.picture.length > 0) {
      const pic = metadata.common.picture[0];
      picture = URL.createObjectURL(new Blob([pic.data], { type: pic.format }));
    }

    return {
      id: crypto.randomUUID(),
      title,
      artist,
      album,
      picture,
      duration,
    };
  } catch (err) {
    console.error('Metadata extraction failed:', file.name, err);
    return fallback;
  }
}