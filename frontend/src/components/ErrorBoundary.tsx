import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Typography, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div style={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center',
          color: 'white',
          padding: '20px',
          textAlign: 'center'
        }}>
          <Text type="danger" style={{ marginBottom: '10px' }}>加载数字人组件失败</Text>
          <Text style={{ color: '#rgba(255,255,255,0.6)', fontSize: '12px', marginBottom: '20px' }}>
            {this.state.error?.message || '未知错误'}
          </Text>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => this.setState({ hasError: false, error: null })}
            ghost
          >
            重试
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
