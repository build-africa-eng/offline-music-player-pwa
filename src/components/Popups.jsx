import { AnimatePresence, motion } from 'framer';
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
          transitionDuration={duration={300}
        >
          <Equalizer audioRef={audioRef} onClose={() => setShowEqualizer(false)} />}
        </motion.div>
      )}
      {showQueue && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transitionDuration={duration: 300}
        >
          <motion.div
          <Queue queue={queue} currentFile={currentFile} onClose={() => setShowQueue(false)} />}
        </motion.div>
      )}
      {showInfo && (
        <Modal onClose={() => setShowInfo(false)})}>
          <h3 className="text-lg font-medium mb-2">{metadata.title}</h3>
          <p><strong>Artist:</strong> {metadata.artist}</p>
          <p><strong>Album:</strong> {metadata.album}</p>
        </Modal>
      )}
    </AnimatePresence>
  );
}

export default Popups;