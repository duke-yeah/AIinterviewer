import React, { useEffect, useRef, useState, Suspense } from 'react';
import { Canvas, useFrame, useGraph } from '@react-three/fiber';
import { useGLTF, Environment, OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

interface Avatar3DProps {
  audioStream: MediaStream | null;
  isSpeaking: boolean;
}

// Ready Player Me model URL (User Custom Avatar)
// Using user-provided model ID
const AVATAR_URL = "https://models.readyplayer.me/693ed87be9195d6546a9adeb.glb";

const Loader = () => {
  return (
    <Html center>
      <div style={{ color: 'white' }}>Loading Avatar...</div>
    </Html>
  );
};

const Model = ({ isSpeaking, audioAnalyser }: { isSpeaking: boolean; audioAnalyser: AnalyserNode | null }) => {
  const { scene } = useGLTF(AVATAR_URL);
  const headMeshRef = useRef<THREE.SkinnedMesh | null>(null);

  useEffect(() => {
    // Find the head mesh that contains morph targets
    let foundMesh: THREE.SkinnedMesh | null = null;
    
    scene.traverse((object) => {
      if ((object as THREE.SkinnedMesh).isMesh && (object as THREE.SkinnedMesh).morphTargetDictionary) {
        // Log available morph targets for debugging
        console.log(`Mesh: ${object.name}`, (object as THREE.SkinnedMesh).morphTargetDictionary);
        
        const mesh = object as THREE.SkinnedMesh;
        // Prioritize Head mesh
        if (mesh.name.includes('Head')) {
          foundMesh = mesh;
        } else if (!foundMesh && mesh.name.includes('Teeth')) {
          // Fallback to Teeth if Head not found yet
          foundMesh = mesh;
        }
      }
    });
    
    headMeshRef.current = foundMesh;
  }, [scene]);

  // Blink animation state
  const [blink, setBlink] = useState(false);

  // Blink logic
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150); // Blink duration
    }, 3000 + Math.random() * 2000); // Random interval between 3-5s

    return () => clearInterval(blinkInterval);
  }, []);

  useFrame(() => {
    if (!headMeshRef.current || !headMeshRef.current.morphTargetDictionary || !headMeshRef.current.morphTargetInfluences) return;

    let openness = 0;

    if (isSpeaking && audioAnalyser) {
      // ... (Audio analysis logic remains the same)
      const dataArray = new Uint8Array(audioAnalyser.frequencyBinCount);
      audioAnalyser.getByteFrequencyData(dataArray);

      // Calculate volume
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      
      // Map to 0-1 with increased sensitivity
      if (average > 5) { 
          openness = Math.min(1, (average / 255) * 5.0);
          if (openness > 0) openness = Math.max(0.1, openness);
      }
    }

    // Apply to mouth morph targets
    const mouthTargetNames = ['mouthOpen', 'jawOpen', 'viseme_aa', 'viseme_O', 'MouthOpen', 'JawOpen'];
    for (const name of mouthTargetNames) {
      if (headMeshRef.current.morphTargetDictionary[name] !== undefined) {
        const index = headMeshRef.current.morphTargetDictionary[name];
        const current = headMeshRef.current.morphTargetInfluences[index];
        headMeshRef.current.morphTargetInfluences[index] = THREE.MathUtils.lerp(current, openness, 0.4);
      }
    }

    // Apply to eye blink targets
    // Ready Player Me uses 'eyesClosed' or 'eyeBlinkLeft'/'eyeBlinkRight'
    const blinkTargetNames = ['eyesClosed', 'eyeBlinkLeft', 'eyeBlinkRight'];
    const blinkValue = blink ? 1 : 0;
    
    for (const name of blinkTargetNames) {
      if (headMeshRef.current.morphTargetDictionary[name] !== undefined) {
        const index = headMeshRef.current.morphTargetDictionary[name];
        const current = headMeshRef.current.morphTargetInfluences[index];
        // Fast lerp for blinking
        headMeshRef.current.morphTargetInfluences[index] = THREE.MathUtils.lerp(current, blinkValue, 0.5);
      }
    }
  });

  // Adjust position to center the head
  // Ready Player Me avatars are ~1.7m tall. Eyes are around 1.6m.
  // Moving model down by -1.6m puts eyes around y=0.
  return <primitive object={scene} position={[0, -1.62, 0]} scale={[1.0, 1.0, 1.0]} />;
};

// Preload the model
useGLTF.preload(AVATAR_URL);

const Avatar3D: React.FC<Avatar3DProps> = ({ audioStream, isSpeaking }) => {
  const [audioAnalyser, setAudioAnalyser] = useState<AnalyserNode | null>(null);

  useEffect(() => {
    if (isSpeaking && audioStream) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) {
            console.warn("Web Audio API not supported");
            return;
        }
        
        const ctx = new AudioContextClass();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        
        // Ensure stream is active before connecting
        if (audioStream.active) {
            const source = ctx.createMediaStreamSource(audioStream);
            source.connect(analyser);
            setAudioAnalyser(analyser);
        }

        return () => {
          if (ctx.state !== 'closed') {
             ctx.close().catch(console.error);
          }
        };
      } catch (e) {
          console.error("Failed to initialize AudioContext:", e);
      }
    } else {
      setAudioAnalyser(null);
    }
  }, [isSpeaking, audioStream]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {/* Close-up camera for "Head Only" view */}
      <Canvas camera={{ position: [0, 0, 0.6], fov: 35 }}>
        <ambientLight intensity={1.8} /> {/* Slightly brighter for face close-up */}
        <directionalLight position={[2, 2, 5]} intensity={1.5} />
        <spotLight position={[-2, 5, 2]} intensity={1} />
        
        <Suspense fallback={<Loader />}>
            <Model isSpeaking={isSpeaking} audioAnalyser={audioAnalyser} />
            <Environment preset="city" />
        </Suspense>
        
        {/* Lock controls to head area */}
        <OrbitControls 
            enableZoom={true} 
            enablePan={false} 
            minDistance={0.4}
            maxDistance={0.8}
            minPolarAngle={Math.PI / 2.2} 
            maxPolarAngle={Math.PI / 1.8} 
            target={[0, 0.05, 0]} 
        />
      </Canvas>
    </div>
  );
};

export default Avatar3D;
