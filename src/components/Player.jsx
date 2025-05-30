import { useState } from 'react';
function Player({ file }) {
  return (
    <div className="p-4 bg-gray-200">
      {file && (
        <audio
          src={URL.createObjectURL(file)}
          controls
          className="w-full"
        ></audio>
      )}
    </div>
  );
}
export default Player;
