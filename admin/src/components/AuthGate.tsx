import React, { useState } from 'react';
import { useAppContext } from '../store';
import './AuthGate.css';

const AuthGate: React.FC = () => {
  const { login } = useAppContext();
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [errorLocal, setErrorLocal] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !secret) {
      setErrorLocal('Please provide both API URL and Secret.');
      return;
    }
    
    let validUrl = url;
    try {
      if (!url.startsWith('http')) {
        validUrl = 'https://' + url;
      }
      new URL(validUrl);
    } catch {
      setErrorLocal('Invalid API URL format.');
      return;
    }

    setErrorLocal('');
    login(validUrl, secret);
  };

  return (
    <div className="auth-gate-container">
      <div className="auth-card glass">
        <div className="auth-header">
          <div className="auth-logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--accent-hover)" />
                  <stop offset="100%" stopColor="var(--accent-color)" />
                </linearGradient>
              </defs>
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <h2>Temp Mail Admin</h2>
          <p>Login to your inbox node</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="url">API Base URL</label>
            <input
              id="url"
              type="text"
              placeholder="e.g. https://api.yourdomain.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              autoComplete="url"
            />
          </div>

          <div className="form-group">
            <label htmlFor="secret">API Secret</label>
            <input
              id="secret"
              type="password"
              placeholder="••••••••••••••••"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
            />
          </div>

          {errorLocal && <div className="auth-error">{errorLocal}</div>}

          <button type="submit" className="auth-submit">
            Connect
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthGate;
