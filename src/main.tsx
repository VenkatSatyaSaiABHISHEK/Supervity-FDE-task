import { StrictMode, Component, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Global error boundary — catches ANY React crash and shows the error
// so we never see a blank screen again
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          position: 'fixed', inset: 0, background: '#0f172a',
          color: '#f8fafc', fontFamily: 'monospace',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '2rem', gap: '1rem'
        }}>
          <div style={{ fontSize: 32 }}>⚠️</div>
          <h2 style={{ fontSize: 18, fontWeight: 'bold', color: '#f87171' }}>
            SupportFlow AI — Startup Error
          </h2>
          <pre style={{
            background: '#1e293b', padding: '1rem',
            borderRadius: 8, maxWidth: 700, overflowX: 'auto',
            fontSize: 12, lineHeight: 1.6, color: '#fca5a5',
            border: '1px solid #ef4444'
          }}>
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack?.split('\n').slice(0, 8).join('\n')}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#6366f1', color: 'white', border: 'none',
              padding: '0.5rem 1.5rem', borderRadius: 8,
              cursor: 'pointer', fontSize: 14, fontWeight: 'bold'
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
