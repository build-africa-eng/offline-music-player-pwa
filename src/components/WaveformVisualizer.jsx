import { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';

function WaveformVisualizer({ audioFile }) {
  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);

  useEffect(() => {
    if (!waveformRef.current) return;

    wavesurferRef.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#1db954',
      progressColor: '#1ed760',
      height: 40,
      barWidth: 2,
      responsive: true,
    });

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (audioFile && wavesurferRef.current) {
      const url = URL.createObjectURL(audioFile);
      wavesurferRef.current.load(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [audioFile]);

  return <div ref={waveformRef} className="w-full mt-2 sm:mt-0" />;
}

export default WaveformVisualizer;