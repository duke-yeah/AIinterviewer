import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Layout, Row, Col } from 'antd';
import AvatarConference from './components/AvatarConference';
import ChatInterface from './components/ChatInterface';

const { Header, Content } = Layout;

const InterviewPage = () => {
  const [audioStream, setAudioStream] = React.useState<MediaStream | null>(null);
  const [isAvatarSpeaking, setIsAvatarSpeaking] = React.useState(false);

  return (
    <Layout style={{ height: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold' }}>AI Interviewer</div>
      </Header>
      <Content style={{ padding: '24px' }}>
        <Row gutter={[16, 16]} style={{ height: '100%' }}>
          <Col xs={24} md={12} lg={14} style={{ height: '100%' }}>
            <AvatarConference audioStream={audioStream} isSpeaking={isAvatarSpeaking} />
          </Col>
          <Col xs={24} md={12} lg={10} style={{ height: '100%' }}>
            <ChatInterface 
              onAudioPlay={(stream) => {
                setAudioStream(stream);
                setIsAvatarSpeaking(true);
              }}
              onAudioEnd={() => {
                setIsAvatarSpeaking(false);
              }}
            />
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

function App() {
  return (
    <ConfigProvider>
      <Router>
        <div className="app-container">
          <Routes>
            <Route path="/" element={<Navigate to="/interview" replace />} />
            <Route path="/interview" element={<InterviewPage />} />
          </Routes>
        </div>
      </Router>
    </ConfigProvider>
  );
}

export default App;
