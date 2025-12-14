import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Card, List, Typography, Space } from 'antd';
import { SendOutlined, AudioOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Text } = Typography;

interface Message {
  type: 'text' | 'audio' | 'system';
  content: string;
  sender: 'user' | 'ai' | 'system';
}

interface ChatInterfaceProps {
  onAudioPlay?: (stream: MediaStream) => void;
  onAudioEnd?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onAudioPlay, onAudioEnd }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Connect to WebSocket
    const ws = new WebSocket('ws://localhost:8080/ws');
    
    ws.onopen = () => {
      console.log('Connected to WebSocket');
      setIsConnected(true);
      setMessages(prev => [...prev, { type: 'system', content: '已连接到面试服务器', sender: 'ai' }]);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        setMessages(prev => [...prev, msg]);

        // Auto-play audio if received from AI
        if (msg.type === 'audio' && msg.sender === 'ai') {
          playAudio(msg.content);
        }
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    };
    // ... (rest of websocket handling)

    ws.onclose = () => {
      console.log('Disconnected from WebSocket');
      setIsConnected(false);
      setMessages(prev => [...prev, { type: 'system', content: '连接已断开', sender: 'ai' }]);
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, []);

  const playAudio = (base64Audio: string) => {
    // Convert base64 to blob to create URL
    const binaryString = window.atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'audio/mp3' });
    const url = URL.createObjectURL(blob);
    
    const audio = new Audio(url);
    audioRef.current = audio;
    
    audio.onplay = () => {
      // Create a MediaStreamDestination to capture the audio
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = ctx.createMediaElementSource(audio);
      const destination = ctx.createMediaStreamDestination();
      source.connect(destination);
      source.connect(ctx.destination); // Also connect to speakers
      
      if (onAudioPlay) {
        onAudioPlay(destination.stream);
      }
    };

    audio.onended = () => {
      if (onAudioEnd) {
        onAudioEnd();
      }
    };

    audio.play().catch(e => console.error("Auto-play failed", e));
  };


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!inputValue.trim() || !wsRef.current) return;

    const message = {
      type: 'text',
      content: inputValue,
      sender: 'user'
    };

    wsRef.current.send(JSON.stringify(message));
    setMessages(prev => [...prev, message as Message]);
    setInputValue('');
  };

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = (reader.result as string).split(',')[1];
          if (wsRef.current) {
            const message = {
              type: 'audio',
              content: base64Audio,
              sender: 'user'
            };
            wsRef.current.send(JSON.stringify(message));
            setMessages(prev => [...prev, { type: 'text', content: '🎤 (语音发送中...)', sender: 'user' }]);
          }
        };
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setMessages(prev => [...prev, { type: 'system', content: '无法访问麦克风', sender: 'system' }]);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <Card title="面试对话" style={{ height: '100%', display: 'flex', flexDirection: 'column' }} bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', paddingRight: '8px' }}>
        <List
          dataSource={messages}
          renderItem={(item) => (
            <List.Item style={{ border: 'none', justifyContent: item.sender === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ 
                maxWidth: '70%', 
                backgroundColor: item.sender === 'user' ? '#1890ff' : '#f0f2f5',
                color: item.sender === 'user' ? '#fff' : '#000',
                padding: '8px 12px',
                borderRadius: '8px',
                wordWrap: 'break-word'
              }}>
                {item.type === 'system' ? (
                  <Text type="secondary" style={{ fontSize: '12px' }}>{item.content}</Text>
                ) : item.type === 'audio' ? (
                  <audio controls src={`data:audio/webm;base64,${item.content}`} />
                ) : (
                  item.content
                )}
              </div>
            </List.Item>
          )}
        />
        <div ref={messagesEndRef} />
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <TextArea 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="请输入您的回答..."
          autoSize={{ minRows: 1, maxRows: 4 }}
          disabled={!isConnected}
        />
        <Button 
          type="primary" 
          icon={<SendOutlined />} 
          onClick={sendMessage}
          disabled={!isConnected}
        >
          发送
        </Button>
        <Button 
          icon={<AudioOutlined />} 
          type={isRecording ? 'primary' : 'default'}
          danger={isRecording}
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          disabled={!isConnected}
          title="按住说话"
        >
          {isRecording ? '松开发送' : '按住说话'}
        </Button>
      </div>
    </Card>
  );
};

export default ChatInterface;
