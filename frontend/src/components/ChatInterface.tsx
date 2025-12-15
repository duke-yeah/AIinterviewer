import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Card, List, Typography } from 'antd';
import { SendOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Text } = Typography;

interface Message {
  type: 'text' | 'audio' | 'system';
  content: string;
  sender: 'user' | 'ai' | 'system';
}

interface ChatInterfaceProps {
  sessionId: string;
  incomingMessage: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ sessionId, incomingMessage }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (incomingMessage) {
       setMessages(prev => [...prev, { type: 'text', content: incomingMessage, sender: 'ai' }]);
    }
  }, [incomingMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || !sessionId) return;

    const message = {
      type: 'text',
      content: inputValue,
      sender: 'user'
    } as Message;

    setMessages(prev => [...prev, message]);
    setInputValue('');

    try {
       await fetch('http://localhost:8010/human', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           text: message.content,
           type: 'chat',
           interrupt: true,
           sessionid: sessionId // main.py handles int conversion if needed, but safer to match
         })
       });
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { type: 'system', content: '发送失败', sender: 'system' }]);
    }
  };

  return (
    <Card title="面试对话" style={{ height: '100%', display: 'flex', flexDirection: 'column' }} styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}>
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
          placeholder={sessionId ? "请输入您的回答..." : "正在连接面试官..."}
          autoSize={{ minRows: 1, maxRows: 4 }}
          disabled={!sessionId}
        />
        <Button 
          type="primary" 
          icon={<SendOutlined />} 
          onClick={sendMessage}
          disabled={!sessionId}
        >
          发送
        </Button>
      </div>
    </Card>
  );
};

export default ChatInterface;
