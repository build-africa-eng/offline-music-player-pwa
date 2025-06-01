import { useMusic } from '../context/MusicContext';

function QueueView({ songId }) {
  const { queue, selectSong, currentFile } = useMusic();

  return (
    <div className="absolute bottom-16 left-16 w-full max-w-xs bg-background dark:bg-background-dark shadow-lg rounded-lg p-3 z-20 sm:max-w-sm">
      <h3 className="text-sm font-semibold mb-2">Queue</h3>
      {queue.length === 0 ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">No songs in queue.</p>
      ) : (
        <ul className="space-y-1 max-h-40 overflow-y-auto">
          {queue.map((song) => (
            <li
              key={song.id}
              onClick={() => selectSong(song.id)}
              className={`text-sm p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer transition-colors ${song.id === currentFile?.id ? 'bg-primary text-white' : 'text-gray-800 dark:text-gray-200'}`}
            >
              {song.title} - {song.artist}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default QueueView;