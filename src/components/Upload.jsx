import { useRef } from 'react';
import { useMusic } from '../context/MusicContext';
import { Upload, File } from 'lucide-react';
import toast from 'react-hot-toast';

function UploadComponent() {
  const { handleUpload } = useMusic();
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const processFiles = async (files) => {
    if (!files || files.length === 0) {
      toast.error('No files selected.');
      return;
    }

    const uploadTime = new Date().toLocaleString('en-US', {
      timeZone: 'Africa/Nairobi', // EAT (East Africa Time)
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }); // e.g., "Wednesday, June 04, 2025, 08:01 PM"

    let audioFilesFound = false;
    let nonAudioFilesSkipped = false;

    for (const file of files) {
      if (file.type.startsWith('audio/')) {
        audioFilesFound = true;
        await handleUpload(file);
        console.log(`Uploaded ${file.name} at ${uploadTime}`); // Log upload time
      } else {
        nonAudioFilesSkipped = true;
      }
    }

    if (!audioFilesFound) {
      toast.error('No audio files found in the selection.');
      return;
    }

    if (nonAudioFilesSkipped) {
      toast.info('Some non-audio files were skipped.');
    }

    toast.success('Audio files uploaded successfully!');
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    await processFiles([file]); // Process single file
    e.target.value = '';
  };

  const handleFolderChange = async (e) => {
    const files = Array.from(e.target.files);
    await processFiles(files); // Process all files in folder
    e.target.value = '';
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
        Supported formats: All valid audio types (MP3, WAV, FLAC, OGG, M4A, etc.)
      </p>
    </div>
  );
}

export default UploadComponent;