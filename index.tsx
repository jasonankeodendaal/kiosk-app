import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

// Error Boundary for production crashes
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };
  readonly props: Readonly<ErrorBoundaryProps>;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("Critical System Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: 40, 
          fontFamily: 'sans-serif', 
          backgroundColor: '#1e293b', 
          color: 'white', 
          height: '100vh', 
          width: '100vw',
          display:'flex', 
          flexDirection:'column', 
          alignItems:'center', 
          justifyContent:'center',
          textAlign: 'center'
        }}>
          <h1 style={{fontSize: 24, marginBottom: 16, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px'}}>System Malfunction</h1>
          <p style={{opacity: 0.7, marginBottom: 32}}>The kiosk encountered a critical error during startup.</p>
          <pre style={{
            backgroundColor: '#0f172a', 
            padding: 24, 
            borderRadius: 12, 
            maxWidth: '90%', 
            width: '600px',
            overflow: 'auto', 
            color: '#f87171',
            textAlign: 'left',
            border: '1px solid #334155',
            fontFamily: 'monospace',
            fontSize: '12px'
          }}>
            {this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              marginTop: 32, 
              padding: '16px 32px', 
              backgroundColor: '#3b82f6', 
              color: 'white', 
              border: 'none', 
              borderRadius: 12, 
              cursor: 'pointer', 
              fontWeight: 'bold',
              fontSize: '14px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
             Reboot System
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);