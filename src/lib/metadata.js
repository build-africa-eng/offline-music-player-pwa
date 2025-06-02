import jsmediatags from 'jsmediatags';

export async function extractMetadata(file) {
  return new Promise((resolve, reject) => {
    new jsmediatags.Reader(file)
      .read({
        onSuccess: (tag) => {
          const metadata = {
            title: tag.tags.title || file.name,
            artist: tag.tags.artist || 'Unknown',
            album: tag.tags.album || 'Unknown',
            picture: tag.tags.picture ? {
              data: tag.tags.picture.data,
              format: tag.tags.picture.format
            } : null
          };
          resolve(metadata);
        },
        onError: (error) => {
          console.error('Metadata extraction error:', error);
          resolve({ title: file.name, artist: 'Unknown', album: 'Unknown', picture: null });
        }
      });
  });
}