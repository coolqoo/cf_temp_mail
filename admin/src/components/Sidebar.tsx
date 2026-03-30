import React from 'react';
import { useAppContext } from '../store';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  const { logout, apiBaseUrl } = useAppContext();

  // We are creating a pure navigation sidebar modeled after modern SaaS Dashboards
  return (
    <div className="app-sidebar">
      <div className="sidebar-top">
        <div className="brand" title={apiBaseUrl}>
          <div className="brand-logo">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Flame-like shape to match the orange accent vibe */}
              <path d="M12 2C12 2 17 6 17 12C17 14.7614 14.7614 17 12 17C9.23858 17 7 14.7614 7 12C7 6 12 2 12 2Z" fill="var(--accent-color)" />
              <path d="M12 22C14.7614 22 17 19.7614 17 17C17 14.2386 14.7614 12 12 12C9.23858 12 7 14.2386 7 17C7 19.7614 9.23858 22 12 22Z" fill="url(#grad)" />
              <defs>
                <linearGradient id="grad" x1="12" y1="12" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="var(--accent-color)" stopOpacity="0.8" />
                  <stop offset="1" stopColor="var(--accent-hover)" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          Temp Mail
        </div>

        <nav className="nav-menu">
          <div className="nav-group">
            <div className="nav-title">ACCOUNT</div>
            <a href="#" className="nav-item active">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              Activity Logs
            </a>
            
            <a href="#" className="nav-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              Inbox Routing
            </a>
            
            <a href="#" className="nav-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              Settings
            </a>
          </div>
        </nav>
      </div>

      <div className="sidebar-bottom">
        <a href="#" className="nav-item text-tertiary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          What's New
          <span className="badge">12</span>
        </a>
        <div className="user-profile" onClick={logout} title="Click to disconnect">
          <div className="avatar">AD</div>
          <div className="user-info">
            <span className="user-name text-ellipsis">Admin User</span>
            <span className="user-sub text-ellipsis">{apiBaseUrl.replace(/^https?:\/\//, '')}</span>
          </div>
          <svg className="collapse-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
