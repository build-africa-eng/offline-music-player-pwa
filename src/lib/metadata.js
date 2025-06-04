import { parseBlob } from 'music-metadata';

/**
 * Extracts metadata from an audio file, including title, artist, album, picture, and duration.
 * Uses `music-metadata` for robust metadata extraction across all audio formats.
 * 
 * @param {File} file - The audio file to extract metadata from.
 * @returns {Promise<object>} The extracted metadata object with a unique ID.
 */
export async function extractMetadata(file) {
  let title = file.name.split('.').slice(0, -1).join('.'); // Fallback to filename without extension
  let artist = 'Unknown';
  let album = 'Unknown';
  let picture = null;
  let duration = 0;

  try {
    const metadata = await parseBlob(file, { duration: true }); // Enable duration parsing
    title = metadata.common.title || title;
    artist = metadata.common.artist || artist;
    album = metadata.common.album || album;
    duration = metadata.format.duration || 0;

    // Extract cover art if present and convert to Blob URL
    if (metadata.common.picture && metadata.common.picture.length > 0) {
      const pic = metadata.common.picture[0];
      picture = URL.createObjectURL(new Blob([pic.data], { type: pic.format }));
    }
  } catch (err) {
    console.error('Metadata extraction failed for file:', file.name, err);
    // Fallback to basic metadata; no need to rethrow as it’s handled gracefully
  }

  return {
    id: crypto.randomUUID(), // Unique ID for each song
    title,
    artist,
    album,
    picture, // Blob URL for artwork, or null if not available
    duration, // Duration in seconds
  };
}