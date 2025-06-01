import { useRef } from 'react';
import { useMusic } from '../context/MusicContext';
import { Upload, File } from 'lucide-react';

function Upload() {
  const { handleUpload } = useMusic();
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleFolderChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      for (const file of files) {
        await handleUpload(file);
      }
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => fileInputRef.current.click()}
        className="bg-primary hover:bg-secondary text-white text-sm sm:text-base font-bold py-2 px-3 sm:px-4 rounded-lg transition-colors flex items-center gap-2"
        aria-label="Upload audio file"
      >
        <Upload className="w-4 h-4" /> Upload File
      </button>
      <input
        type="file"
        accept="audio/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <button
        onClick={() => folderInputRef.current.click()}
        className="bg-primary hover:bg-secondary text-white text-sm sm:text-base font-bold py-2 px-3 sm:px-4 rounded-lg transition-colors flex items-center gap-2"
        aria-label="Upload audio folder"
      >
        <File className="w-4 h-4" /> Upload Folder
      </button>
      <input
        type="file"
        accept="audio/*"
        className="hidden"
        ref={folderInputRef}
        onChange={handleFolderChange}
        {...{ webkitdirectory: '', directory: '' }}
      />
    </div>
  );
}

export default Upload;