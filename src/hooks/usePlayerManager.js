import { useState, useEffect } from 'react';

export function usePlayerManager() {
  const [shuffle, setShuffle] = useState(() => JSON.parse(localStorage.getItem('playerShuffle')) || false);
  const [repeat, setRepeat] = useState(() => localStorage.getItem('playerRepeat') || 'off');

  useEffect(() => {
    localStorage.setItem('playerShuffle', JSON.stringify(shuffle));
  }, [shuffle]);

  useEffect(() => {
    localStorage.setItem('playerRepeat', repeat);
  }, [repeat]);

  return { shuffle, setShuffle, repeat, setRepeat };
}