import React, { useEffect, useRef, useState } from 'react';
import { UserOutlined } from '@ant-design/icons';

interface SpeakingAvatarProps {
  audioStream: MediaStream | null;
  isSpeaking: boolean;
}

const SpeakingAvatar: React.FC<SpeakingAvatarProps> = ({ audioStream, isSpeaking }) => {
  const [mouthOpenness, setMouthOpenness] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isSpeaking && audioStream) {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Create analyser
      analyserRef.current = ctx.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      // Create source
      sourceRef.current = ctx.createMediaStreamSource(audioStream);
      sourceRef.current.connect(analyserRef.current);
      // Note: We don't connect to destination here to avoid feedback loop if it's mic input
      // But for playback stream, we might need to if the stream isn't already playing.
      // However, usually the audio element plays the sound, we just analyze it.

      const analyze = () => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        
        // Map average volume (0-255) to mouth openness (0-1)
        // Adjust sensitivity as needed
        const sensitivity = 2.5;
        const openness = Math.min(1, (average / 255) * sensitivity);
        
        setMouthOpenness(openness);

        animationFrameRef.current = requestAnimationFrame(analyze);
      };

      analyze();
    } else {
      setMouthOpenness(0);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // Don't close AudioContext immediately as it might be expensive to recreate frequently
      // but strictly speaking we should cleanup.
    };
  }, [isSpeaking, audioStream]);

  // Simple CSS-based Avatar
  return (
    <div style={{ position: 'relative', width: '200px', height: '200px' }}>
      {/* Head */}
      <div style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        backgroundColor: '#e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
      }}>
        {/* Eyes */}
        <div style={{ display: 'flex', gap: '40px', marginBottom: '20px' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#333' }}></div>
          <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#333' }}></div>
        </div>

        {/* Mouth */}
        <div style={{
          width: '60px',
          height: `${10 + mouthOpenness * 40}px`, // Dynamic height based on volume
          backgroundColor: '#d64545',
          borderRadius: '20px',
          transition: 'height 0.05s ease-out',
          border: '2px solid #a33'
        }}></div>
      </div>
    </div>
  );
};

export default SpeakingAvatar;
