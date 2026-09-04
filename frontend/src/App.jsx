import React, { useState, useEffect } from 'react';
import ImageUpload from './components/ImageUpload';
import { Satellite, Activity } from 'lucide-react';

export default function App() {
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    // Check backend health status on mount
    fetch('http://127.0.0.1:8000/health')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Backend health check failed');
      })
      .then((data) => {
        if (data.status === 'healthy') {
          setBackendStatus('connected');
        } else {
          setBackendStatus('error');
        }
      })
      .catch(() => {
        setBackendStatus('offline');
      });
  }, []);

  return (
    <div className="app-container">
      {/* Header Bar */}
      <header className="header">
        <div className="brand">
          <div className="brand-icon">
            <Satellite size={22} />
          </div>
          <div>
            <div className="brand-title">SatQuery AI</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Satellite Imagery Query & Analytics Platform
            </div>
          </div>
        </div>

        {/* Backend Status Indicator */}
        <div
          className="status-badge"
          style={{
            borderColor:
              backendStatus === 'connected'
                ? 'rgba(16, 185, 129, 0.3)'
                : 'rgba(244, 63, 94, 0.3)',
            color:
              backendStatus === 'connected'
                ? 'var(--accent-emerald)'
                : 'var(--accent-rose)',
            background:
              backendStatus === 'connected'
                ? 'rgba(16, 185, 129, 0.1)'
                : 'rgba(244, 63, 94, 0.1)',
          }}
        >
          <Activity size={14} />
          <span>
            {backendStatus === 'connected'
              ? 'Backend API Connected (8000)'
              : backendStatus === 'checking'
              ? 'Checking API...'
              : 'Backend Offline'}
          </span>
        </div>
      </header>

      {/* Main Upload Module */}
      <main>
        <ImageUpload />
      </main>
    </div>
  );
}
