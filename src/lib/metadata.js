import * as mm from 'music-metadata';

/**
 * Extracts metadata from an audio file, including title, artist, album, and picture.
 * Uses `music-metadata-browser` for robust metadata extraction.
 * 
 * @param {File} file - The audio file to extract metadata from.
 * @returns {Promise<object>} The extracted metadata object.
 */
export async function extractMetadata(file) {
  let title = file.name;
  let artist = 'Unknown';
  let album = 'Unknown';
  let picture = null;

  try {
    const metadata = await mm.parseBlob(file);
    title = metadata.common.title || title;
    artist = metadata.common.artist || artist;
    album = metadata.common.album || album;

    // Extract cover art if present
    if (metadata.common.picture && metadata.common.picture.length > 0) {
      const pic = metadata.common.picture[0];
      picture = {
        data: pic.data,
        format: pic.format,
      };
    }
  } catch (err) {
    console.error('music-metadata-browser failed:', err);
  }

  return {
    id: file.name,
    title,
    artist,
    album,
    picture,
    file,
  };
}