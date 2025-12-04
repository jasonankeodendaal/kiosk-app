
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
          <h1 style={{fontSize: 24, marginBottom: 16, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', color: '#f87171'}}>System Malfunction</h1>
          <p style={{opacity: 0.9, marginBottom: 16, fontSize: '18px'}}>The kiosk encountered a critical data error.</p>
          
          <div style={{backgroundColor: '#0f172a', padding: 20, borderRadius: 12, border: '1px solid #334155', maxWidth: '600px', marginBottom: 20, textAlign: 'left'}}>
              <h3 style={{color: '#60a5fa', fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px'}}>Diagnosis</h3>
              <p style={{fontFamily: 'monospace', color: '#cbd5e1', fontSize: '14px', marginBottom: 0}}>
                 {this.state.error?.toString()}
              </p>
          </div>

          <div style={{maxWidth: '600px', textAlign: 'left', lineHeight: '1.6', color: '#94a3b8', fontSize: '14px'}}>
             <strong>Recommended Fix:</strong><br/>
             This usually happens when the local data cache is corrupted or empty. 
             Please try clearing the browser's Local Storage.
          </div>

          <div style={{display: 'flex', gap: '16px', marginTop: 32}}>
              <button 
                onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                }} 
                style={{
                  padding: '16px 32px', 
                  backgroundColor: '#ef4444', 
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
                 Clear Data & Reboot
              </button>
              
              <button 
                onClick={() => window.location.reload()} 
                style={{
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
                 Restart System
              </button>
          </div>
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
