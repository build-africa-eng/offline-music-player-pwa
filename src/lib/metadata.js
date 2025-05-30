import * as mm from 'music-metadata-browser';
export async function extractMetadata(file) {
  const metadata = await mm.parseBlob(file);
  return {
    id: file.name,
    title: metadata.common.title || file.name,
    artist: metadata.common.artist || 'Unknown',
    album: metadata.common.album || 'Unknown',
  };
}
