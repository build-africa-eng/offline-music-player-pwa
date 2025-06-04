import { AnimatePresence, motion } from 'framer-motion';
import Equalizer from './Equalizer';
import Queue from './Queue';
import Modal from './Modal';

function Popups({
  showEqualizer,
  setShowEqualizer,
  showQueue,
  setShowQueue,
  showInfo,
  setShowInfo,
  audioRef,
  queue,
  currentFile,
  metadata,
}) {
  return (
    <AnimatePresence>
      {showEqualizer && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
          <div
            className="bg-background dark:bg-gray-900 rounded-lg shadow-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Equalizer audioRef={audioRef} onClose={() => setShowEqualizer(false)} />
          </div>
        </motion.div>
      )}
      {showQueue && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
          <div
            className="bg-background dark:bg-gray-900 rounded-lg shadow-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Queue queue={queue} currentFile={currentFile} onClose={() => setShowQueue(false)} />
          </div>
        </motion.div>
      )}
      {showInfo && (
        <Modal
          isOpen={showInfo}
          onClose={() => setShowInfo(false)}
          title="Track Info"
        >
          <div className="space-y-2">
            <h3 className="text-lg font-medium mb-2">{metadata.title}</h3>
            <p><strong>Artist:</strong> {metadata.artist || 'Unknown'}</p>
            <p><strong>Album:</strong> {metadata.album || 'Unknown'}</p>
          </div>
        </Modal>
      )}
    </AnimatePresence>
  );
}

export default Popups;