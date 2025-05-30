import { useState } from 'react';
function Player({ file }) {
  return (
    <div className="p-4 bg-background text-text">
      <h2 className="text-2xl font-bold mb-4">Player</h2>
      {file ? (
        <audio src={URL.createObjectURL(file)} controls className="w-full" />
      ) : (
        <p className="text-text">No song selected</p>
      )}
    </div>
  );
}

export default Player;