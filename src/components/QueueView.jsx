import { useEffect, useRef } from 'react';
import { useMusic } from '../context/MusicContext';
import { X } from 'lucide-react';

function QueueView() {
  const { queue, setQueue, selectSong, currentFile } = useMusic();
  const queueRef = useRef(null);

  useEffect(() => {
    const el = queueRef.current?.querySelector(`[data-id="${currentFile?.id}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [currentFile?.id]);

  const handleRemove = (songId) => {
    setQueue(prev => prev.filter(song => song.id !== songId));
  };

  const handleReorder = (index, newIndex) => {
    const newQueue = [...queue];
    const [moved] = newQueue.splice(index, 1);
    newQueue.splice(newIndex, 0, moved);
    setQueue(newQueue);
  };

  return (
    <div className="absolute bottom-20 left-2 right-2 sm:left-16 sm:right-auto sm:max-w-sm bg-background dark:bg-background-dark shadow-lg rounded-lg p-3 z-20 max-h-32 sm:max-h-40 overflow-y-auto">
      <h3 className="text-sm font-semibold mb-2">Queue</h3>
      {queue.length === 0 ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">No songs in queue.</p>
      ) : (
        <ul ref={queueRef} className="space-y-1">
          {queue.map((song, idx) => (
            <li
              key={song.id}
              data-id={song.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('index', idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const fromIndex = parseInt(e.dataTransfer.getData('index'));
                handleReorder(fromIndex, idx);
              }}
              className={`flex items-center gap-2 text-sm p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer transition-colors ${song.id === currentFile?.id ? 'bg-primary text-white' : 'text-gray-800 dark:text-gray-200'}`}
            >
              <span onClick={() => selectSong(song.id)} className="flex-1 truncate">
                {song.title} - {song.artist}
              </span>
              <button
                onClick={() => handleRemove(song.id)}
                className="p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"
                aria-label={`Remove ${song.title}`}
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default QueueView;