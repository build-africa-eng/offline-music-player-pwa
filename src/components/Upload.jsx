import { useRef } from 'react';
import { useMusic } from '../context/MusicContext';
import { Upload, File } from 'lucide-react';
import toast from 'react-hot-toast';

function UploadComponent() {
  const { handleUpload } = useMusic();
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      toast.error('No file selected.');
    } else if (!file.type.startsWith('audio/')) {
      toast.error('Unsupported file type. Please upload an audio file.');
    } else {
      handleUpload(file);
    }
    e.target.value = ''; // Reset file input so user can reselect same file
  };

  const handleFolderChange = async (e) => {
    const files = Array.from(e.target.files);
    const audioFiles = files.filter(file => file.type.startsWith('audio/'));

    if (audioFiles.length > 0) {
      for (const file of audioFiles) {
        await handleUpload(file);
      }
      toast.success('Folder uploaded successfully!');
    } else {
      toast.error('No audio files found in selected folder.');
    }

    e.target.value = ''; // Reset folder input
  };

  return (
    <div className="flex flex-col gap-1 sm:gap-2">
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
          webkitdirectory=""
          directory=""
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        Supported formats: MP3, WAV, OGG, FLAC
      </p>
    </div>
  );
}

export default UploadComponent;