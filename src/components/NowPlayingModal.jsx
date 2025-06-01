import Modal from 'react-modal';
import { X } from 'lucide-react';

function NowPlayingModal({ isOpen, onClose, metadata }) {
  const { title = 'Unknown', artist = 'Unknown', artwork = null, album = 'Unknown' } = metadata || {};

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="bg-background dark:bg-background-dark rounded-lg p-4 max-w-md mx-auto mt-20 sm:mt-32 outline-none"
      overlayClassName="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <button onClick={onClose} className="absolute top-2 right-2 text-gray-600 dark:text-gray-400 hover:text-primary">
        <X size={20} />
      </button>
      <div className="flex flex-col items-center gap-4">
        {artwork ? (
          <img
            src={URL.createObjectURL(new Blob([artwork.data], { type: artwork.format }))}
            alt="Album art"
            className="w-40 h-40 rounded-lg"
          />
        ) : (
          <div className="w-40 h-40 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center text-4xl">
            🎵
          </div>
        )}
        <div className="text-center">
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{artist}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Album: {album}</p>
        </div>
      </div>
    </Modal>
  );
}

export default NowPlayingModal;