import jsmediatags from 'jsmediatags';

export async function extractMetadata(file) {
  return new Promise((resolve) => {
    jsmediatags.read(file, {
      onSuccess: (tag) => {
        resolve({
          title: tag.tags.title || file.name?.replace(/\.[^/.]+$/, '') || 'Untitled',
          artist: tag.tags.artist || 'Unknown',
        });
      },
      onError: () => {
        resolve({
          title: file.name?.replace(/\.[^/.]+$/, '') || 'Untitled',
          artist: 'Unknown',
        });
      },
    });
  });
}
