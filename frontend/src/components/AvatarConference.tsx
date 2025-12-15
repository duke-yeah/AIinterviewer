import React from 'react';
import { Card, Typography } from 'antd';
import AIAvatarVideo from './AIAvatarVideo';
import ErrorBoundary from './ErrorBoundary';

const { Title } = Typography;

interface AvatarConferenceProps {
  onSessionId: (id: string) => void;
  onLLMMessage: (text: string) => void;
}

const AvatarConference: React.FC<AvatarConferenceProps> = ({ onSessionId, onLLMMessage }) => {
  return (
    <Card
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#000'
      }}
      styles={{
        body: {
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 0
        }
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
          <AIAvatarVideo onSessionId={onSessionId} onLLMMessage={onLLMMessage} />
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
        </div>
      </div>
    </Card>
  );
};

export default AvatarConference;
