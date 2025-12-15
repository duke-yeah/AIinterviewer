import React, { useEffect, useRef, useState } from 'react';
import { Spin } from 'antd';

interface AIAvatarVideoProps {
  onSessionId: (sessionId: string) => void;
  onLLMMessage: (text: string) => void;
}

const AIAvatarVideo: React.FC<AIAvatarVideoProps> = ({ onSessionId, onLLMMessage }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const start = async () => {
      setLoading(true);
      setError(null);
      try {
        const pc = new RTCPeerConnection({
          sdpSemantics: 'unified-plan',
          iceServers: []
        });
        pcRef.current = pc;

        // Add transceivers
        pc.addTransceiver('video', { direction: 'recvonly' });
        pc.addTransceiver('audio', { direction: 'recvonly' });

        // Handle tracks
        pc.ontrack = (evt) => {
          console.log('Track received:', evt.track.kind);
          if (evt.track.kind === 'video') {
            if (videoRef.current) {
              console.log('Setting video stream');
              videoRef.current.srcObject = evt.streams[0];
              videoRef.current.onloadedmetadata = () => {
                  console.log('Video metadata loaded, attempting to play');
                  videoRef.current?.play().catch(e => console.error('Video play error:', e));
              };
            }
          } else if (evt.track.kind === 'audio') {
            if (audioRef.current) {
              console.log('Setting audio stream');
              audioRef.current.srcObject = evt.streams[0];
              audioRef.current.onloadedmetadata = () => {
                  console.log('Audio metadata loaded, attempting to play');
                  audioRef.current?.play().catch(e => console.error('Audio play error:', e));
              };
            }
          }
        };

        // Data Channel
        const dc = pc.createDataChannel('chat');
        dcRef.current = dc;
        dc.onopen = () => console.log('Data Channel Open');
        dc.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'llm') {
              onLLMMessage(data.text);
            }
          } catch (e) {
            console.error('Data Channel Parse Error', e);
          }
        };

        // Offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Wait for ICE
        await new Promise<void>((resolve) => {
          if (pc.iceGatheringState === 'complete') resolve();
          else {
            const check = () => {
              if (pc.iceGatheringState === 'complete') {
                pc.removeEventListener('icegatheringstatechange', check);
                resolve();
              }
            };
            pc.addEventListener('icegatheringstatechange', check);
          }
        });

        if (!mounted) return;

        // Send to Server
        const response = await fetch('http://localhost:8010/offer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sdp: pc.localDescription?.sdp,
            type: pc.localDescription?.type,
            avatar_id: 'ai_model' // Default avatar
          })
        });

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const answer = await response.json();
        
        if (!mounted) return;
        
        if (pc.signalingState === 'closed') {
            return;
        }

        onSessionId(answer.sessionid);
        await pc.setRemoteDescription(answer);
        setLoading(false);

      } catch (err: any) {
        console.error(err);
        if (mounted) {
            setError(err.message || 'Connection failed');
            setLoading(false);
        }
      }
    };

    start();

    return () => {
      mounted = false;
      pcRef.current?.close();
    };
  }, []);

  if (error) {
    return (
      <div style={{ color: 'white', textAlign: 'center', paddingTop: '20px' }}>
        <p>连接失败: {error}</p>
        <p>请确保后端服务已启动 (python main.py)</p>
        <button onClick={start} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          重试连接
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#000' }}>
      {loading && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}><Spin size="large" /></div>}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={false} // Allow audio by default, but browser policy might block it
        controls={true}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
      {/* Hidden audio element for fallback */}
      <audio ref={audioRef} autoPlay />
      
      {/* Overlay button to handle autoplay policy */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 10,
          // Hide if no error or if loading
          visibility: loading ? 'hidden' : 'visible',
          opacity: loading ? 0 : 1,
          pointerEvents: 'none' // Let clicks pass through if not needed, but we need clicks for the button
        }}
        // Only block clicks if we need to show the button
        onClick={(e) => {
            // If the user clicks anywhere on the overlay, try to play
            videoRef.current?.play().catch(() => {});
            audioRef.current?.play().catch(() => {});
            // Hide overlay after click
            e.currentTarget.style.display = 'none';
        }}
      >
        <div 
            style={{ 
                pointerEvents: 'auto', 
                cursor: 'pointer',
                padding: '20px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '50%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}
        >
            <div style={{ fontSize: '40px', color: 'white' }}>▶</div>
            <div style={{ color: 'white', marginTop: '10px' }}>点击开始面试</div>
        </div>
      </div>
    </div>
  );
};

export default AIAvatarVideo;
