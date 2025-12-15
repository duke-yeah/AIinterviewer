import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Layout, Row, Col } from 'antd';
import AvatarConference from './components/AvatarConference';
import ChatInterface from './components/ChatInterface';

const { Header, Content } = Layout;

const InterviewPage = () => {
  const [sessionId, setSessionId] = useState<string>('');
  const [incomingMessage, setIncomingMessage] = useState<string>('');

  return (
    <Layout style={{ height: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold' }}>AI Interviewer</div>
      </Header>
      <Content style={{ padding: '24px' }}>
        <Row gutter={[16, 16]} style={{ height: '100%' }}>
          <Col xs={24} md={12} lg={14} style={{ height: '100%' }}>
            <AvatarConference 
              onSessionId={setSessionId} 
              onLLMMessage={setIncomingMessage}
            />
          </Col>
          <Col xs={24} md={12} lg={10} style={{ height: '100%' }}>
            <ChatInterface 
              sessionId={sessionId}
              incomingMessage={incomingMessage}
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
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
