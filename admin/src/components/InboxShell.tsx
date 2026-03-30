import React, { useEffect } from 'react';
import { useAppContext } from '../store';
import Sidebar from './Sidebar';
import DetailPane from './DetailPane';
import './InboxShell.css';

const InboxShell: React.FC = () => {
  const { logout, error, clearError, apiBaseUrl } = useAppContext();

  // Handle global key presses (e.g. Esc to clear error)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearError();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearError]);

  return (
    <div className="inbox-shell">
      {/* Top Navigation Bar */}
      <header className="top-bar glass">
        <div className="top-bar-left">
          <div className="brand" title={apiBaseUrl}>
            <div className="brand-dot"></div>
            Temp Mail
          </div>
        </div>
        
        <div className="top-bar-right">
          <button className="logout-btn" onClick={logout} title="Disconnect">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </header>

      {/* Global Error Toast */}
      {error && (
        <div className="global-toast error-toast">
          <div className="toast-content">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
          <button onClick={clearError} className="toast-close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      )}

      {/* Split Layout */}
      <main className="split-view">
        <Sidebar />
        <DetailPane />
      </main>
    </div>
  );
};

export default InboxShell;
