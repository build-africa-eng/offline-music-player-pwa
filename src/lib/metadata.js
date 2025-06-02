import * as mm from 'music-metadata-browser';
import jsmediatags from 'jsmediatags';

/**
 * Extracts metadata from an audio file, including title, artist, album, and picture.
 * Uses `music-metadata-browser` for robust metadata and `jsmediatags` as a fallback for embedded artwork.
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

    // If cover art is present in metadata.common.picture
    if (metadata.common.picture && metadata.common.picture.length > 0) {
      const pic = metadata.common.picture[0];
      picture = {
        data: pic.data,
        format: pic.format
      };
    }
  } catch (err) {
    console.error('music-metadata-browser failed:', err);
  }

  // Fallback to jsmediatags for picture only if missing
  if (!picture) {
    try {
      await new Promise((resolve, reject) => {
        new jsmediatags.Reader(file)
          .read({
            onSuccess: (tag) => {
              if (tag.tags.picture) {
                picture = {
                  data: tag.tags.picture.data,
                  format: tag.tags.picture.format
                };
              }
              resolve();
            },
            onError: (error) => {
              console.warn('jsmediatags fallback failed:', error);
              resolve();
            }
          });
      });
    } catch (err) {
      console.warn('jsmediatags threw an error:', err);
    }
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