import React from 'react';
import { Card, Typography } from 'antd';
import Avatar3D from './Avatar3D';
import ErrorBoundary from './ErrorBoundary';

const { Title, Text } = Typography;

interface AvatarConferenceProps {
  audioStream: MediaStream | null;
  isSpeaking: boolean;
}

const AvatarConference: React.FC<AvatarConferenceProps> = ({ audioStream, isSpeaking }) => {
  return (
    <Card 
      style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        backgroundColor: '#000' 
      }} 
      bodyStyle={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: 0
      }}
    >
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <ErrorBoundary>
          <Avatar3D audioStream={audioStream} isSpeaking={isSpeaking} />
        </ErrorBoundary>
        
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          backgroundColor: 'rgba(0,0,0,0.5)',
          padding: '8px 16px',
          borderRadius: '4px'
        }}>
          <Title level={5} style={{ color: '#fff', margin: 0 }}>AI 面试官</Title>
          <Text style={{ color: 'rgba(255,255,255,0.7)' }}>
            {isSpeaking ? '正在说话...' : '正在聆听...'}
          </Text>
        </div>
      </div>
    </Card>
  );
};

export default AvatarConference;
