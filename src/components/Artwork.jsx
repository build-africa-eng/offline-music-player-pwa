function Artwork({ artwork, title }) {
  const artSrc = artwork
    ? URL.createObjectURL(new Blob([artwork.data], { type: artwork.format }))
    : '/logo.png';

  return (
    <img
      src={artSrc}
      alt={title}
      className="w-48 h-48 sm:w-64 sm:h-64 rounded-lg shadow-lg object-cover"
    />
  );
}

export default Artwork;